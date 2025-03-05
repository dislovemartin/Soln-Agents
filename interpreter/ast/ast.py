"""
AST classes for our interpreter.
"""

from abc import ABC, abstractmethod
from typing import List, Any, Optional

class Expr(ABC):
    """Base class for all expression AST nodes."""
    
    @abstractmethod
    def accept(self, visitor):
        """Accept a visitor."""
        pass

class Binary(Expr):
    """Binary expression (e.g., left + right)."""
    
    def __init__(self, left, operator, right):
        self.left = left
        self.operator = operator
        self.right = right
    
    def accept(self, visitor):
        return visitor.visit_binary_expr(self)

class Grouping(Expr):
    """Grouping expression (e.g., (expr))."""
    
    def __init__(self, expression):
        self.expression = expression
    
    def accept(self, visitor):
        return visitor.visit_grouping_expr(self)

class Literal(Expr):
    """Literal expression (e.g., 123, "hello")."""
    
    def __init__(self, value):
        self.value = value
    
    def accept(self, visitor):
        return visitor.visit_literal_expr(self)

class Unary(Expr):
    """Unary expression (e.g., !expr, -expr)."""
    
    def __init__(self, operator, right):
        self.operator = operator
        self.right = right
    
    def accept(self, visitor):
        return visitor.visit_unary_expr(self)

class Variable(Expr):
    """Variable expression."""
    
    def __init__(self, name):
        self.name = name
    
    def accept(self, visitor):
        return visitor.visit_variable_expr(self)

class Assign(Expr):
    """Assignment expression (e.g., x = expr)."""
    
    def __init__(self, name, value):
        self.name = name
        self.value = value
    
    def accept(self, visitor):
        return visitor.visit_assign_expr(self)

class Logical(Expr):
    """Logical expression (e.g., a and b, x or y)."""
    
    def __init__(self, left, operator, right):
        self.left = left
        self.operator = operator
        self.right = right
    
    def accept(self, visitor):
        return visitor.visit_logical_expr(self)

class Call(Expr):
    """Function call expression (e.g., fn(args))."""
    
    def __init__(self, callee, paren, arguments):
        self.callee = callee      # The function to call
        self.paren = paren        # The closing parenthesis token (for error reporting)
        self.arguments = arguments # The arguments to the function
    
    def accept(self, visitor):
        return visitor.visit_call_expr(self)

class List(Expr):
    """List expression (e.g., [1, 2, 3])."""
    
    def __init__(self, elements):
        self.elements = elements
    
    def accept(self, visitor):
        return visitor.visit_list_expr(self)

class Get(Expr):
    """Get expression for list indexing (e.g., list[index])."""
    
    def __init__(self, object, index):
        self.object = object
        self.index = index
    
    def accept(self, visitor):
        return visitor.visit_get_expr(self)

class Stmt(ABC):
    """Base class for all statement AST nodes."""
    
    @abstractmethod
    def accept(self, visitor):
        """Accept a visitor."""
        pass

class Expression(Stmt):
    """Expression statement."""
    
    def __init__(self, expression):
        self.expression = expression
    
    def accept(self, visitor):
        return visitor.visit_expression_stmt(self)

class Print(Stmt):
    """Print statement."""
    
    def __init__(self, expression):
        self.expression = expression
    
    def accept(self, visitor):
        return visitor.visit_print_stmt(self)

class Var(Stmt):
    """Variable declaration statement."""
    
    def __init__(self, name, initializer):
        self.name = name
        self.initializer = initializer
    
    def accept(self, visitor):
        return visitor.visit_var_stmt(self)

class Block(Stmt):
    """Block statement (list of statements inside braces)."""
    
    def __init__(self, statements):
        self.statements = statements
    
    def accept(self, visitor):
        return visitor.visit_block_stmt(self)

class If(Stmt):
    """If statement."""
    
    def __init__(self, condition, then_branch, else_branch):
        self.condition = condition
        self.then_branch = then_branch
        self.else_branch = else_branch
    
    def accept(self, visitor):
        return visitor.visit_if_stmt(self)

class While(Stmt):
    """While statement."""
    
    def __init__(self, condition, body):
        self.condition = condition
        self.body = body
    
    def accept(self, visitor):
        return visitor.visit_while_stmt(self)

class Function(Stmt):
    """Function declaration statement."""
    
    def __init__(self, name, params, body):
        self.name = name
        self.params = params
        self.body = body
    
    def accept(self, visitor):
        return visitor.visit_function_stmt(self)

class Return(Stmt):
    """Return statement."""
    
    def __init__(self, keyword, value):
        self.keyword = keyword  # For error reporting
        self.value = value
    
    def accept(self, visitor):
        return visitor.visit_return_stmt(self)