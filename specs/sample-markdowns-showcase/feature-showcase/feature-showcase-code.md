# Code

This demonstrates code formatting in markdown.

---

## Inline Code

Use backticks for inline code:

Use `const variable = value` for inline code.

The `npm install` command installs dependencies.

Call the `calculateTotal()` function to get results.

---

## Code Blocks

### JavaScript

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return `Welcome to fabriqa.ai`;
}

greet('Developer');
```

### Python

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

### TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const createUser = (data: User): User => {
  return { ...data };
};
```

### JSON

```json
{
  "name": "fabriqa.ai",
  "version": "1.0.0",
  "features": [
    "Live Preview",
    "Source Mode",
    "Reading Mode"
  ]
}
```

---

## Features

- **Inline Code**: Highlighted with background color
- **Code Blocks**: Language-specific syntax highlighting
- **Language Info**: Language label dimmed at top
- **Background**: Subtle background for code blocks

---

## Syntax

Inline code:
```markdown
`code here`
```

Code blocks:
````markdown
```language
code here
```
````

---

*Part of fabriqa.ai markdown editor Feature Showcase*
