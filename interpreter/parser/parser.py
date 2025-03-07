"""
Parser implementation for our interpreter.
"""

from interpreter.lexer.token import Token, TokenType
from interpreter.ast.ast import (
    Expr, Binary, Grouping, Literal, Unary, Variable, Assign, Logical, Call, List, Get,
    Stmt, Expression, Print, Var, Block, If, While, Function, Return
)

class ParseError(Exception):
    """Exception raised for parsing errors."""
    pass

class Parser:
    """Parser class for constructing an AST from tokens."""
    
    def __init__(self, tokens):
        self.tokens = tokens
        self.current = 0
    
    def parse(self):
        """Parse the tokens into a list of statements."""
        statements = []
        while not self.is_at_end():
            statements.append(self.declaration())
        
        return statements
    
    def declaration(self):
        """Parse a declaration."""
        try:
            if self.match(TokenType.FUN):
                return self.function("function")
            if self.match(TokenType.VAR):
                return self.var_declaration()
            
            return self.statement()
        except ParseError:
            self.synchronize()
            return None
    
    def function(self, kind):
        """Parse a function declaration."""
        name = self.consume(TokenType.IDENTIFIER, f"Expect {kind} name.")
        
        self.consume(TokenType.LEFT_PAREN, f"Expect '(' after {kind} name.")
        parameters = []
        
        if not self.check(TokenType.RIGHT_PAREN):
            while True:
                if len(parameters) >= 255:
                    self.error(self.peek(), "Cannot have more than 255 parameters.")
                
                parameters.append(self.consume(TokenType.IDENTIFIER, "Expect parameter name."))
                
                if not self.match(TokenType.COMMA):
                    break
        
        self.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.")
        
        self.consume(TokenType.LEFT_BRACE, f"Expect '{{' before {kind} body.")
        body = self.block()
        
        return Function(name, parameters, body)
    
    def var_declaration(self):
        """Parse a variable declaration."""
        name = self.consume(TokenType.IDENTIFIER, "Expect variable name.")
        
        initializer = None
        if self.match(TokenType.EQUAL):
            initializer = self.expression()
        
        self.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.")
        return Var(name, initializer)
    
    def statement(self):
        """Parse a statement."""
        if self.match(TokenType.PRINT):
            return self.print_statement()
        if self.match(TokenType.LEFT_BRACE):
            return Block(self.block())
        if self.match(TokenType.IF):
            return self.if_statement()
        if self.match(TokenType.WHILE):
            return self.while_statement()
        if self.match(TokenType.FOR):
            return self.for_statement()
        if self.match(TokenType.RETURN):
            return self.return_statement()
        
        return self.expression_statement()
    
    def print_statement(self):
        """Parse a print statement."""
        value = self.expression()
        self.consume(TokenType.SEMICOLON, "Expect ';' after value.")
        return Print(value)
    
    def return_statement(self):
        """Parse a return statement."""
        keyword = self.previous()
        value = None
        
        if not self.check(TokenType.SEMICOLON):
            value = self.expression()
        
        self.consume(TokenType.SEMICOLON, "Expect ';' after return value.")
        return Return(keyword, value)
    
    def block(self):
        """Parse a block of statements."""
        statements = []
        
        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            statements.append(self.declaration())
        
        self.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.")
        return statements
    
    def if_statement(self):
        """Parse an if statement."""
        self.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.")
        condition = self.expression()
        self.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.")
        
        then_branch = self.statement()
        else_branch = None
        
        if self.match(TokenType.ELSE):
            else_branch = self.statement()
        
        return If(condition, then_branch, else_branch)
    
    def while_statement(self):
        """Parse a while statement."""
        self.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.")
        condition = self.expression()
        self.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.")
        
        body = self.statement()
        
        return While(condition, body)
    
    def for_statement(self):
        """Parse a for statement and desugar it into a while loop."""
        self.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.")
        
        # Initializer
        initializer = None
        if self.match(TokenType.SEMICOLON):
            initializer = None
        elif self.match(TokenType.VAR):
            initializer = self.var_declaration()
        else:
            initializer = self.expression_statement()
        
        # Condition
        condition = None
        if not self.check(TokenType.SEMICOLON):
            condition = self.expression()
        self.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.")
        
        # Increment
        increment = None
        if not self.check(TokenType.RIGHT_PAREN):
            increment = self.expression()
        self.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.")
        
        # Body
        body = self.statement()
        
        # Desugar for loop into a while loop
        if increment is not None:
            body = Block([body, Expression(increment)])
        
        if condition is None:
            condition = Literal(True)
        
        body = While(condition, body)
        
        if initializer is not None:
            body = Block([initializer, body])
        
        return body
    
    def expression_statement(self):
        """Parse an expression statement."""
        expr = self.expression()
        self.consume(TokenType.SEMICOLON, "Expect ';' after expression.")
        return Expression(expr)
    
    def expression(self):
        """Parse an expression."""
        return self.assignment()
    
    def assignment(self):
        """Parse an assignment expression."""
        expr = self.or_expr()
        
        if self.match(TokenType.EQUAL):
            equals = self.previous()
            value = self.assignment()
            
            if isinstance(expr, Variable):
                name = expr.name
                return Assign(name, value)
            
            self.error(equals, "Invalid assignment target.")
        
        return expr
    
    def or_expr(self):
        """Parse an 'or' logical expression."""
        expr = self.and_expr()
        
        while self.match(TokenType.OR):
            operator = self.previous()
            right = self.and_expr()
            expr = Logical(expr, operator, right)
        
        return expr
    
    def and_expr(self):
        """Parse an 'and' logical expression."""
        expr = self.equality()
        
        while self.match(TokenType.AND):
            operator = self.previous()
            right = self.equality()
            expr = Logical(expr, operator, right)
        
        return expr
    
    def equality(self):
        """Parse an equality expression."""
        expr = self.comparison()
        
        while self.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL):
            operator = self.previous()
            right = self.comparison()
            expr = Binary(expr, operator, right)
        
        return expr
    
    def comparison(self):
        """Parse a comparison expression."""
        expr = self.term()
        
        while self.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL):
            operator = self.previous()
            right = self.term()
            expr = Binary(expr, operator, right)
        
        return expr
    
    def term(self):
        """Parse a term expression."""
        expr = self.factor()
        
        while self.match(TokenType.MINUS, TokenType.PLUS):
            operator = self.previous()
            right = self.factor()
            expr = Binary(expr, operator, right)
        
        return expr
    
    def factor(self):
        """Parse a factor expression."""
        expr = self.unary()
        
        while self.match(TokenType.SLASH, TokenType.STAR):
            operator = self.previous()
            right = self.unary()
            expr = Binary(expr, operator, right)
        
        return expr
    
    def unary(self):
        """Parse a unary expression."""
        if self.match(TokenType.BANG, TokenType.MINUS):
            operator = self.previous()
            right = self.unary()
            return Unary(operator, right)
        
        return self.call()
    
    def call(self):
        """Parse a function call expression."""
        expr = self.primary()
        
        while True:
            if self.match(TokenType.LEFT_PAREN):
                expr = self.finish_call(expr)
            elif self.match(TokenType.LEFT_BRACKET):
                index = self.expression()
                self.consume(TokenType.RIGHT_BRACKET, "Expect ']' after index.")
                expr = Get(expr, index)
            else:
                break
        
        return expr
    
    def finish_call(self, callee):
        """Finish parsing a function call."""
        arguments = []
        
        if not self.check(TokenType.RIGHT_PAREN):
            while True:
                if len(arguments) >= 255:
                    self.error(self.peek(), "Cannot have more than 255 arguments.")
                
                arguments.append(self.expression())
                
                if not self.match(TokenType.COMMA):
                    break
        
        paren = self.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.")
        
        return Call(callee, paren, arguments)
    
    def primary(self):
        """Parse a primary expression."""
        if self.match(TokenType.FALSE):
            return Literal(False)
        if self.match(TokenType.TRUE):
            return Literal(True)
        if self.match(TokenType.NIL):
            return Literal(None)
        
        if self.match(TokenType.NUMBER, TokenType.STRING):
            return Literal(self.previous().literal)
        
        if self.match(TokenType.LEFT_BRACKET):
            elements = []
            
            if not self.check(TokenType.RIGHT_BRACKET):
                while True:
                    elements.append(self.expression())
                    
                    if not self.match(TokenType.COMMA):
                        break
            
            self.consume(TokenType.RIGHT_BRACKET, "Expect ']' after list elements.")
            return List(elements)
        
        if self.match(TokenType.IDENTIFIER):
            return Variable(self.previous())
        
        if self.match(TokenType.LEFT_PAREN):
            expr = self.expression()
            self.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.")
            return Grouping(expr)
        
        raise self.error(self.peek(), "Expect expression.")
    
    def match(self, *types):
        """Check if the current token has any of the given types."""
        for token_type in types:
            if self.check(token_type):
                self.advance()
                return True
        
        return False
    
    def check(self, token_type):
        """Check if the current token has the given type."""
        if self.is_at_end():
            return False
        return self.peek().type == token_type
    
    def advance(self):
        """Advance to the next token."""
        if not self.is_at_end():
            self.current += 1
        return self.previous()
    
    def is_at_end(self):
        """Check if we have reached the end of the tokens."""
        return self.peek().type == TokenType.EOF
    
    def peek(self):
        """Return the current token without consuming it."""
        return self.tokens[self.current]
    
    def previous(self):
        """Return the previous token."""
        return self.tokens[self.current - 1]
    
    def consume(self, token_type, message):
        """Consume the current token if it has the expected type."""
        if self.check(token_type):
            return self.advance()
        
        raise self.error(self.peek(), message)
    
    def error(self, token, message):
        """Report a parsing error."""
        if token.type == TokenType.EOF:
            error_msg = f"line {token.line} at end: {message}"
        else:
            error_msg = f"line {token.line} at '{token.lexeme}': {message}"
        
        raise ParseError(error_msg)
    
    def synchronize(self):
        """Synchronize the parser after an error."""
        self.advance()
        
        while not self.is_at_end():
            if self.previous().type == TokenType.SEMICOLON:
                return
            
            if self.peek().type in [
                TokenType.CLASS,
                TokenType.FUN,
                TokenType.VAR,
                TokenType.FOR,
                TokenType.IF,
                TokenType.WHILE,
                TokenType.PRINT,
                TokenType.RETURN
            ]:
                return
            
            self.advance()