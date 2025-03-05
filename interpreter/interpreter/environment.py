"""
Environment class for managing variable scopes.
"""

class Environment:
    """Environment class for variable scopes."""
    
    def __init__(self, enclosing=None):
        self.values = {}
        self.enclosing = enclosing
    
    def define(self, name, value):
        """Define a variable in the current environment."""
        self.values[name.lexeme if hasattr(name, 'lexeme') else name] = value
    
    def get(self, name):
        """Get a variable from the environment."""
        key = name.lexeme
        
        if key in self.values:
            return self.values[key]
        
        if self.enclosing:
            return self.enclosing.get(name)
        
        raise RuntimeError(f"Undefined variable '{key}'.")
    
    def assign(self, name, value):
        """Assign a value to an existing variable."""
        key = name.lexeme
        
        if key in self.values:
            self.values[key] = value
            return
        
        if self.enclosing:
            self.enclosing.assign(name, value)
            return
        
        raise RuntimeError(f"Undefined variable '{key}'.")
    
    def ancestor(self, distance):
        """Get an ancestor environment at the given distance."""
        environment = self
        for _ in range(distance):
            environment = environment.enclosing
        
        return environment
    
    def get_at(self, distance, name):
        """Get a variable from an ancestor environment."""
        return self.ancestor(distance).values.get(name)
    
    def assign_at(self, distance, name, value):
        """Assign a value to a variable in an ancestor environment."""
        self.ancestor(distance).values[name.lexeme] = value