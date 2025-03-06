# SolnAI Platform

This is a full-featured AI platform with agent orchestration, web UI, and browser extension capabilities.

## Testing

### Running Tests

The SolnAI project has comprehensive test suites for all components. You can run tests using the following commands:

```bash
# Run all tests
yarn test

# Run server tests only
yarn test:server 

# Run frontend tests only
yarn test:frontend

# Run agent tests only
yarn test:agents

# Run browser extension tests
yarn test:extension

# Run a specific custom agent's tests
yarn test:custom-agent -- path/to/agent/tests
```

### Test Coverage

To generate test coverage reports:

```bash
# Server test coverage
cd server && yarn test:coverage

# Frontend test coverage
cd frontend && yarn test:coverage

# Browser extension test coverage
cd browser-extension && yarn test:coverage
```

## Features

- **Data Types:** Integers, floats, strings, booleans, and lists.
- **Variables:** Dynamic typing with global and local scopes.
- **Control Structures:** If-else statements, while loops, and for loops.
- **Functions:** Function definitions with parameters and return values.
- **Operators:** Arithmetic, comparison, logical, and assignment operators.

## Project Structure

- `interpreter/`: Main package containing all components of the interpreter.
  - `lexer/`: The lexical analyzer that converts source code into tokens.
  - `parser/`: The parser that converts tokens into an Abstract Syntax Tree (AST).
  - `ast/`: Definitions of AST nodes for expressions and statements.
  - `interpreter/`: The runtime interpreter that evaluates the AST.
  - `main.py`: Entry point for the interpreter.

## Architecture

The interpreter follows a classic compiler/interpreter architecture:

1. **Lexer:** Scans the source code and produces a stream of tokens.
2. **Parser:** Parses the tokens into an Abstract Syntax Tree (AST).
3. **Resolver:** Resolves variable references and binds them to their declarations.
4. **Interpreter:** Evaluates the AST to execute the program.

## Language Syntax

### Variables

```
var name = expression;
```

### Arithmetic

```
1 + 2
3 - 4
5 * 6
7 / 8
```

### Comparison and Logical Operators

```
a > b
c < d
e >= f
g <= h
i == j
k != l
true and false
true or false
!true
```

### Control Structures

```
// If-else statement
if (condition) {
    // then branch
} else {
    // else branch
}

// While loop
while (condition) {
    // body
}

// For loop
for (var i = 0; i < 10; i = i + 1) {
    // body
}
```

### Functions

```
fun name(param1, param2) {
    // body
    return value;
}
```

### Lists

```
var list = [1, 2, 3];
list[0]  // Accessing elements
```

## Running the Interpreter

To run the interpreter on a file:

```bash
python -m interpreter.main your_file.lang
```

To start the interactive REPL:

```bash
python -m interpreter.main
```

## Example

```
// Variables and assignments
var a = 10;
var b = 20;
var c = a + b;
print "a + b = " + c;

// Functions
fun add(a, b) {
    return a + b;
}

fun factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

print "add(3, 4) = " + add(3, 4);
print "factorial(5) = " + factorial(5);

// Lists
var list = [1, 2, 3, 4, 5];
print "list: " + list;
print "list[2]: " + list[2];
```

## Learning and Resources

This interpreter was built based on principles from:

- "Crafting Interpreters" by Robert Nystrom
- "Programming Language Pragmatics" by Michael L. Scott
- "Compilers: Principles, Techniques, and Tools" by Alfred V. Aho, Monica S. Lam, Ravi Sethi, and Jeffrey D. Ullman

## Future Extensions

Possible future enhancements:
- Class-based object system
- Modules and imports
- Tailored standard library
- Performance optimizations
- JIT compilation