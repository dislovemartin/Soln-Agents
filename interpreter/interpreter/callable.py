"""
Callable interface for function-like objects.
"""

from abc import ABC, abstractmethod
import time
from interpreter.interpreter.environment import Environment
from interpreter.ast.ast import Function

class Callable(ABC):
    """Base class for all callable objects."""
    
    @abstractmethod
    def call(self, interpreter, arguments):
        """Call the callable with the given arguments."""
        pass
    
    @abstractmethod
    def arity(self):
        """Return the number of arguments the callable expects."""
        pass

class Clock(Callable):
    """Native function for getting the current time in seconds."""
    
    def call(self, interpreter, arguments):
        """Return the current time in seconds."""
        return time.time()
    
    def arity(self):
        """The clock function takes no arguments."""
        return 0
    
    def __str__(self):
        return "<native fn: clock>"

class FunctionObj(Callable):
    """User-defined function."""
    
    def __init__(self, declaration, closure, is_initializer=False):
        self.declaration = declaration
        self.closure = closure
        self.is_initializer = is_initializer
    
    def call(self, interpreter, arguments):
        """Call the function with the given arguments."""
        environment = Environment(self.closure)
        
        # Bind parameters to arguments
        for i in range(len(self.declaration.params)):
            environment.define(
                self.declaration.params[i].lexeme,
                arguments[i]
            )
        
        try:
            # Execute the function body
            interpreter.execute_block(self.declaration.body, environment)
        except Return as return_value:
            # If this is a class initializer, always return 'this'
            if self.is_initializer:
                return self.closure.get_at(0, "this")
            
            return return_value.value
        
        # If this is a class initializer, always return 'this'
        if self.is_initializer:
            return self.closure.get_at(0, "this")
        
        return None
    
    def arity(self):
        """Return the number of parameters the function takes."""
        return len(self.declaration.params)
    
    def __str__(self):
        return f"<fn {self.declaration.name.lexeme}>"
    
    def bind(self, instance):
        """Bind this method to an instance."""
        environment = Environment(self.closure)
        environment.define("this", instance)
        return FunctionObj(self.declaration, environment, self.is_initializer)

class Return(RuntimeError):
    """Exception raised to handle return statements."""
    
    def __init__(self, value):
        self.value = value
        super().__init__(str(value))