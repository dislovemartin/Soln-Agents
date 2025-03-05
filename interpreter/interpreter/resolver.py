"""
Resolver class for resolving variable references.
"""

from interpreter.ast.ast import (
    Binary, Grouping, Literal, Unary, Variable, Assign, Logical, Call, List as ListExpr, Get,
    Expression, Print, Var, Block, If, While, Function, Return
)
from enum import Enum, auto

class FunctionType(Enum):
    NONE = auto()
    FUNCTION = auto()
    INITIALIZER = auto()
    METHOD = auto()

class ClassType(Enum):
    NONE = auto()
    CLASS = auto()
    SUBCLASS = auto()

class Resolver:
    """Resolver class for resolving variable references."""
    
    def __init__(self, interpreter):
        self.interpreter = interpreter
        self.scopes = []
        self.current_function = FunctionType.NONE
        self.current_class = ClassType.NONE
    
    def resolve(self, statements):
        """Resolve variable references in a list of statements."""
        if isinstance(statements, list):
            for statement in statements:
                if statement is not None:
                    self.resolve_stmt(statement)
        else:
            self.resolve_stmt(statements)
    
    def resolve_stmt(self, stmt):
        """Resolve variable references in a statement."""
        stmt.accept(self)
    
    def resolve_expr(self, expr):
        """Resolve variable references in an expression."""
        expr.accept(self)
    
    def begin_scope(self):
        """Begin a new scope."""
        self.scopes.append({})
    
    def end_scope(self):
        """End the current scope."""
        self.scopes.pop()
    
    def declare(self, name):
        """Declare a variable in the current scope."""
        if not self.scopes:
            return
        
        scope = self.scopes[-1]
        if name.lexeme in scope:
            raise Exception(f"Variable with name '{name.lexeme}' already declared in this scope.")
        
        scope[name.lexeme] = False
    
    def define(self, name):
        """Define a variable in the current scope."""
        if not self.scopes:
            return
        
        self.scopes[-1][name.lexeme] = True
    
    def resolve_local(self, expr, name):
        """Resolve a local variable reference."""
        for i in range(len(self.scopes) - 1, -1, -1):
            if name.lexeme in self.scopes[i]:
                self.interpreter.resolve(expr, len(self.scopes) - 1 - i)
                return
    
    def resolve_function(self, function, function_type):
        """Resolve a function declaration."""
        enclosing_function = self.current_function
        self.current_function = function_type
        
        self.begin_scope()
        
        for param in function.params:
            self.declare(param)
            self.define(param)
        
        self.resolve(function.body)
        
        self.end_scope()
        
        self.current_function = enclosing_function
    
    # Visitor methods for statement types
    
    def visit_block_stmt(self, stmt):
        """Resolve a block statement."""
        self.begin_scope()
        self.resolve(stmt.statements)
        self.end_scope()
        return None
    
    def visit_expression_stmt(self, stmt):
        """Resolve an expression statement."""
        self.resolve_expr(stmt.expression)
        return None
    
    def visit_function_stmt(self, stmt):
        """Resolve a function declaration statement."""
        self.declare(stmt.name)
        self.define(stmt.name)
        
        self.resolve_function(stmt, FunctionType.FUNCTION)
        return None
    
    def visit_if_stmt(self, stmt):
        """Resolve an if statement."""
        self.resolve_expr(stmt.condition)
        self.resolve_stmt(stmt.then_branch)
        if stmt.else_branch:
            self.resolve_stmt(stmt.else_branch)
        return None
    
    def visit_print_stmt(self, stmt):
        """Resolve a print statement."""
        self.resolve_expr(stmt.expression)
        return None
    
    def visit_return_stmt(self, stmt):
        """Resolve a return statement."""
        if self.current_function == FunctionType.NONE:
            raise Exception("Cannot return from top-level code.")
        
        if stmt.value:
            if self.current_function == FunctionType.INITIALIZER:
                raise Exception("Cannot return a value from an initializer.")
            
            self.resolve_expr(stmt.value)
        
        return None
    
    def visit_var_stmt(self, stmt):
        """Resolve a variable declaration statement."""
        self.declare(stmt.name)
        
        if stmt.initializer:
            self.resolve_expr(stmt.initializer)
        
        self.define(stmt.name)
        return None
    
    def visit_while_stmt(self, stmt):
        """Resolve a while statement."""
        self.resolve_expr(stmt.condition)
        self.resolve_stmt(stmt.body)
        return None
    
    # Visitor methods for expression types
    
    def visit_assign_expr(self, expr):
        """Resolve an assignment expression."""
        self.resolve_expr(expr.value)
        self.resolve_local(expr, expr.name)
        return None
    
    def visit_binary_expr(self, expr):
        """Resolve a binary expression."""
        self.resolve_expr(expr.left)
        self.resolve_expr(expr.right)
        return None
    
    def visit_call_expr(self, expr):
        """Resolve a call expression."""
        self.resolve_expr(expr.callee)
        
        for argument in expr.arguments:
            self.resolve_expr(argument)
        
        return None
    
    def visit_get_expr(self, expr):
        """Resolve a get expression."""
        self.resolve_expr(expr.object)
        self.resolve_expr(expr.index)
        return None
    
    def visit_grouping_expr(self, expr):
        """Resolve a grouping expression."""
        self.resolve_expr(expr.expression)
        return None
    
    def visit_list_expr(self, expr):
        """Resolve a list expression."""
        for element in expr.elements:
            self.resolve_expr(element)
        return None
    
    def visit_literal_expr(self, expr):
        """Resolve a literal expression."""
        return None
    
    def visit_logical_expr(self, expr):
        """Resolve a logical expression."""
        self.resolve_expr(expr.left)
        self.resolve_expr(expr.right)
        return None
    
    def visit_unary_expr(self, expr):
        """Resolve a unary expression."""
        self.resolve_expr(expr.right)
        return None
    
    def visit_variable_expr(self, expr):
        """Resolve a variable expression."""
        if self.scopes and expr.name.lexeme in self.scopes[-1] and self.scopes[-1][expr.name.lexeme] is False:
            raise Exception(f"Cannot read local variable '{expr.name.lexeme}' in its own initializer.")
        
        self.resolve_local(expr, expr.name)
        return None