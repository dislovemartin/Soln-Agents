"""
Interpreter implementation.
"""

from interpreter.ast.ast import (
    Binary, Grouping, Literal, Unary, Variable, Assign, Logical, Call, List as ListExpr, Get,
    Expression, Print, Var, Block, If, While, Function, Return
)
from interpreter.lexer.token import TokenType
from interpreter.interpreter.environment import Environment
from interpreter.interpreter.callable import Callable, Clock, FunctionObj, Return

class RuntimeError(Exception):
    """Runtime error in the interpreter."""
    
    def __init__(self, token, message):
        self.token = token
        self.message = message
        super().__init__(f"{message}\n[line {token.line}]")

class Interpreter:
    """Interpreter class for evaluating AST."""
    
    def __init__(self):
        self.globals = Environment()
        self.environment = self.globals
        self.locals = {}
        
        # Define native functions
        self.globals.define("clock", Clock())
    
    def interpret(self, statements):
        """Interpret a list of statements."""
        try:
            for statement in statements:
                if statement is not None:
                    self.execute(statement)
        except RuntimeError as error:
            print(f"Runtime Error: {error}")
    
    def execute(self, stmt):
        """Execute a statement."""
        return stmt.accept(self)
    
    def evaluate(self, expr):
        """Evaluate an expression."""
        return expr.accept(self)
    
    def execute_block(self, statements, environment):
        """Execute a block of statements in a new environment."""
        previous = self.environment
        try:
            self.environment = environment
            
            for statement in statements:
                if statement is not None:
                    self.execute(statement)
        finally:
            self.environment = previous
    
    def resolve(self, expr, depth):
        """Resolve a variable reference to its environment depth."""
        self.locals[expr] = depth
    
    def lookup_variable(self, name, expr):
        """Look up a variable in the appropriate environment."""
        distance = self.locals.get(expr)
        
        if distance is not None:
            return self.environment.get_at(distance, name.lexeme)
        else:
            return self.globals.get(name)
    
    # Visitor methods for statement types
    
    def visit_expression_stmt(self, stmt):
        """Execute an expression statement."""
        self.evaluate(stmt.expression)
        return None
    
    def visit_print_stmt(self, stmt):
        """Execute a print statement."""
        value = self.evaluate(stmt.expression)
        print(self.stringify(value))
        return None
    
    def visit_var_stmt(self, stmt):
        """Execute a variable declaration statement."""
        value = None
        if stmt.initializer:
            value = self.evaluate(stmt.initializer)
        
        self.environment.define(stmt.name, value)
        return None
    
    def visit_block_stmt(self, stmt):
        """Execute a block statement."""
        self.execute_block(stmt.statements, Environment(self.environment))
        return None
    
    def visit_if_stmt(self, stmt):
        """Execute an if statement."""
        if self.is_truthy(self.evaluate(stmt.condition)):
            self.execute(stmt.then_branch)
        elif stmt.else_branch:
            self.execute(stmt.else_branch)
        return None
    
    def visit_while_stmt(self, stmt):
        """Execute a while statement."""
        while self.is_truthy(self.evaluate(stmt.condition)):
            self.execute(stmt.body)
        return None
    
    def visit_function_stmt(self, stmt):
        """Execute a function declaration statement."""
        function = FunctionObj(stmt, self.environment)
        self.environment.define(stmt.name, function)
        return None
    
    def visit_return_stmt(self, stmt):
        """Execute a return statement."""
        value = None
        if stmt.value:
            value = self.evaluate(stmt.value)
        
        raise Return(value)
    
    # Visitor methods for expression types
    
    def visit_binary_expr(self, expr):
        """Evaluate a binary expression."""
        left = self.evaluate(expr.left)
        right = self.evaluate(expr.right)
        
        token_type = expr.operator.type
        
        # Arithmetic operations
        if token_type == TokenType.MINUS:
            self.check_number_operands(expr.operator, left, right)
            return float(left) - float(right)
        elif token_type == TokenType.SLASH:
            self.check_number_operands(expr.operator, left, right)
            if right == 0:
                raise RuntimeError(expr.operator, "Division by zero.")
            return float(left) / float(right)
        elif token_type == TokenType.STAR:
            self.check_number_operands(expr.operator, left, right)
            return float(left) * float(right)
        elif token_type == TokenType.PLUS:
            if isinstance(left, (float, int)) and isinstance(right, (float, int)):
                return float(left) + float(right)
            if isinstance(left, str) or isinstance(right, str):
                return str(left) + str(right)
            raise RuntimeError(expr.operator, "Operands must be two numbers or two strings.")
        
        # Comparison operations
        elif token_type == TokenType.GREATER:
            self.check_number_operands(expr.operator, left, right)
            return float(left) > float(right)
        elif token_type == TokenType.GREATER_EQUAL:
            self.check_number_operands(expr.operator, left, right)
            return float(left) >= float(right)
        elif token_type == TokenType.LESS:
            self.check_number_operands(expr.operator, left, right)
            return float(left) < float(right)
        elif token_type == TokenType.LESS_EQUAL:
            self.check_number_operands(expr.operator, left, right)
            return float(left) <= float(right)
        
        # Equality operations
        elif token_type == TokenType.BANG_EQUAL:
            return not self.is_equal(left, right)
        elif token_type == TokenType.EQUAL_EQUAL:
            return self.is_equal(left, right)
        
        return None
    
    def visit_grouping_expr(self, expr):
        """Evaluate a grouping expression."""
        return self.evaluate(expr.expression)
    
    def visit_literal_expr(self, expr):
        """Evaluate a literal expression."""
        return expr.value
    
    def visit_unary_expr(self, expr):
        """Evaluate a unary expression."""
        right = self.evaluate(expr.right)
        
        if expr.operator.type == TokenType.MINUS:
            self.check_number_operand(expr.operator, right)
            return -float(right)
        elif expr.operator.type == TokenType.BANG:
            return not self.is_truthy(right)
        
        return None
    
    def visit_variable_expr(self, expr):
        """Evaluate a variable expression."""
        return self.lookup_variable(expr.name, expr)
    
    def visit_assign_expr(self, expr):
        """Evaluate an assignment expression."""
        value = self.evaluate(expr.value)
        
        distance = self.locals.get(expr)
        if distance is not None:
            self.environment.assign_at(distance, expr.name, value)
        else:
            self.globals.assign(expr.name, value)
        
        return value
    
    def visit_logical_expr(self, expr):
        """Evaluate a logical expression."""
        left = self.evaluate(expr.left)
        
        # Short-circuit evaluation
        if expr.operator.type == TokenType.OR:
            if self.is_truthy(left):
                return left
        else:  # AND
            if not self.is_truthy(left):
                return left
        
        return self.evaluate(expr.right)
    
    def visit_call_expr(self, expr):
        """Evaluate a call expression."""
        callee = self.evaluate(expr.callee)
        
        arguments = []
        for argument in expr.arguments:
            arguments.append(self.evaluate(argument))
        
        if not isinstance(callee, Callable):
            raise RuntimeError(expr.paren, "Can only call functions and classes.")
        
        if len(arguments) != callee.arity():
            raise RuntimeError(
                expr.paren,
                f"Expected {callee.arity()} arguments but got {len(arguments)}."
            )
        
        return callee.call(self, arguments)
    
    def visit_list_expr(self, expr):
        """Evaluate a list expression."""
        elements = []
        for element in expr.elements:
            elements.append(self.evaluate(element))
        
        return elements
    
    def visit_get_expr(self, expr):
        """Evaluate a get expression (list indexing)."""
        object = self.evaluate(expr.object)
        index = self.evaluate(expr.index)
        
        if not isinstance(object, list):
            raise RuntimeError(expr.index, "Only lists have indices.")
        
        if not isinstance(index, (int, float)):
            raise RuntimeError(expr.index, "Index must be a number.")
        
        index = int(index)
        
        if index < 0 or index >= len(object):
            raise RuntimeError(expr.index, "Index out of bounds.")
        
        return object[index]
    
    # Helper methods
    
    def is_truthy(self, value):
        """Determine if a value is truthy."""
        if value is None:
            return False
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return value != 0
        if isinstance(value, str):
            return len(value) > 0
        return True
    
    def is_equal(self, a, b):
        """Check if two values are equal."""
        if a is None and b is None:
            return True
        if a is None:
            return False
        
        return a == b
    
    def check_number_operand(self, operator, operand):
        """Check if an operand is a number."""
        if isinstance(operand, (int, float)):
            return
        raise RuntimeError(operator, "Operand must be a number.")
    
    def check_number_operands(self, operator, left, right):
        """Check if operands are numbers."""
        if isinstance(left, (int, float)) and isinstance(right, (int, float)):
            return
        raise RuntimeError(operator, "Operands must be numbers.")
    
    def stringify(self, value):
        """Convert a value to a string."""
        if value is None:
            return "nil"
        
        if isinstance(value, bool):
            return str(value).lower()
        
        if isinstance(value, (int, float)):
            text = str(value)
            if text.endswith(".0"):
                text = text[:-2]
            return text
        
        if isinstance(value, list):
            elements = [self.stringify(element) for element in value]
            return "[" + ", ".join(elements) + "]"
        
        return str(value)