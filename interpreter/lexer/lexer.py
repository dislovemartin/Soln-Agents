"""
Lexer implementation for our interpreter.
"""

from interpreter.lexer.token import Token, TokenType

class Lexer:
    """Lexer class for tokenizing source code."""
    
    def __init__(self, source):
        self.source = source
        self.tokens = []
        self.start = 0
        self.current = 0
        self.line = 1
        self.keywords = {
            "and": TokenType.AND,
            "else": TokenType.ELSE,
            "false": TokenType.FALSE,
            "for": TokenType.FOR,
            "fun": TokenType.FUN,
            "if": TokenType.IF,
            "nil": TokenType.NIL,
            "or": TokenType.OR,
            "print": TokenType.PRINT,
            "return": TokenType.RETURN,
            "true": TokenType.TRUE,
            "var": TokenType.VAR,
            "while": TokenType.WHILE
        }
    
    def scan_tokens(self):
        """Scan all tokens in the source code."""
        while not self.is_at_end():
            # We are at the beginning of the next lexeme
            self.start = self.current
            self.scan_token()
        
        self.tokens.append(Token(TokenType.EOF, "", None, self.line))
        return self.tokens
    
    def scan_token(self):
        """Scan a single token."""
        c = self.advance()
        
        # Single-character tokens
        if c == '(': self.add_token(TokenType.LEFT_PAREN)
        elif c == ')': self.add_token(TokenType.RIGHT_PAREN)
        elif c == '{': self.add_token(TokenType.LEFT_BRACE)
        elif c == '}': self.add_token(TokenType.RIGHT_BRACE)
        elif c == '[': self.add_token(TokenType.LEFT_BRACKET)
        elif c == ']': self.add_token(TokenType.RIGHT_BRACKET)
        elif c == ',': self.add_token(TokenType.COMMA)
        elif c == '.': self.add_token(TokenType.DOT)
        elif c == '-': self.add_token(TokenType.MINUS)
        elif c == '+': self.add_token(TokenType.PLUS)
        elif c == ';': self.add_token(TokenType.SEMICOLON)
        elif c == '*': self.add_token(TokenType.STAR)
        
        # One or two character tokens
        elif c == '!':
            self.add_token(TokenType.BANG_EQUAL if self.match('=') else TokenType.BANG)
        elif c == '=':
            self.add_token(TokenType.EQUAL_EQUAL if self.match('=') else TokenType.EQUAL)
        elif c == '<':
            self.add_token(TokenType.LESS_EQUAL if self.match('=') else TokenType.LESS)
        elif c == '>':
            self.add_token(TokenType.GREATER_EQUAL if self.match('=') else TokenType.GREATER)
        
        # Handle comments
        elif c == '/':
            if self.match('/'):
                # A comment goes until the end of the line.
                while self.peek() != '\n' and not self.is_at_end():
                    self.advance()
            else:
                self.add_token(TokenType.SLASH)
        
        # Whitespace
        elif c in [' ', '\r', '\t']:
            # Ignore whitespace
            pass
        elif c == '\n':
            self.line += 1
            
        # String literals
        elif c == '"': self.string()
        
        # Number literals
        elif self.is_digit(c): self.number()
        
        # Identifiers and keywords
        elif self.is_alpha(c): self.identifier()
        
        else:
            raise SyntaxError(f"Unexpected character: {c} at line {self.line}")
    
    def identifier(self):
        """Handle identifiers and keywords."""
        while self.is_alphanumeric(self.peek()):
            self.advance()
        
        # See if the identifier is a reserved word
        text = self.source[self.start:self.current]
        token_type = self.keywords.get(text, TokenType.IDENTIFIER)
        
        self.add_token(token_type)
    
    def number(self):
        """Handle number literals."""
        while self.is_digit(self.peek()):
            self.advance()
        
        # Look for a decimal part
        if self.peek() == '.' and self.is_digit(self.peek_next()):
            # Consume the "."
            self.advance()
            
            while self.is_digit(self.peek()):
                self.advance()
        
        self.add_token(TokenType.NUMBER, float(self.source[self.start:self.current]))
    
    def string(self):
        """Handle string literals."""
        while self.peek() != '"' and not self.is_at_end():
            if self.peek() == '\n':
                self.line += 1
            self.advance()
        
        if self.is_at_end():
            raise SyntaxError(f"Unterminated string at line {self.line}")
        
        # The closing "
        self.advance()
        
        # Trim the surrounding quotes
        value = self.source[self.start + 1:self.current - 1]
        
        # Process escape sequences
        processed_value = ""
        i = 0
        while i < len(value):
            if value[i] == '\\' and i + 1 < len(value):
                if value[i+1] == 'n':
                    processed_value += '\n'
                    i += 2
                    continue
                elif value[i+1] == 't':
                    processed_value += '\t'
                    i += 2
                    continue
                elif value[i+1] == '"':
                    processed_value += '"'
                    i += 2
                    continue
                elif value[i+1] == '\\':
                    processed_value += '\\'
                    i += 2
                    continue
            processed_value += value[i]
            i += 1
        
        self.add_token(TokenType.STRING, processed_value)
    
    def match(self, expected):
        """Check if the current character matches the expected one."""
        if self.is_at_end():
            return False
        if self.source[self.current] != expected:
            return False
        
        self.current += 1
        return True
    
    def peek(self):
        """Return the current character without consuming it."""
        if self.is_at_end():
            return '\0'
        return self.source[self.current]
    
    def peek_next(self):
        """Look at the next character."""
        if self.current + 1 >= len(self.source):
            return '\0'
        return self.source[self.current + 1]
    
    def is_alpha(self, c):
        """Check if a character is alphabetic."""
        return ('a' <= c <= 'z') or ('A' <= c <= 'Z') or c == '_'
    
    def is_alphanumeric(self, c):
        """Check if a character is alphanumeric."""
        return self.is_alpha(c) or self.is_digit(c)
    
    def is_digit(self, c):
        """Check if a character is a digit."""
        return '0' <= c <= '9'
    
    def advance(self):
        """Consume the next character and return it."""
        c = self.source[self.current]
        self.current += 1
        return c
    
    def add_token(self, token_type, literal=None):
        """Add a token to the token list."""
        text = self.source[self.start:self.current]
        self.tokens.append(Token(token_type, text, literal, self.line))
    
    def is_at_end(self):
        """Check if we have reached the end of the source code."""
        return self.current >= len(self.source)