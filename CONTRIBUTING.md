# Contributing to fabriqa.ai markdown editor

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Collaborate openly and transparently

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Visual Studio Code
- Git

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/fabriqa.ai-markdown-editor.git
cd fabriqa.ai-markdown-editor

# Install dependencies
npm install

# Build the extension
npm run build

# Open in VS Code
code .
```

### Running the Extension

1. Press **F5** to launch the Extension Development Host
2. Make changes to code
3. Press **Cmd/Ctrl+R** in Extension Development Host to reload
4. Test your changes

## Development Workflow

### Branch Strategy

- `master` - Main branch, stable releases
- `develop` - Development branch for next release
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm test
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```
   Then open a Pull Request on GitHub

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(editor): add split view mode
fix(treeview): resolve folder hierarchy issue
docs(readme): update installation instructions
refactor(config): simplify config loading logic
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict type checking
- Avoid `any` types (use `unknown` if necessary)
- Document public APIs with JSDoc comments
- Use meaningful variable and function names

```typescript
// Good
function parseMarkdownFile(filePath: string): ParsedDocument {
  // ...
}

// Bad
function parse(p: any) {
  // ...
}
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Max line length: 100 characters
- Use async/await instead of promises

```typescript
// Good
async function loadConfig(): Promise<Config> {
  const content = await fs.readFile('config.yml', 'utf-8');
  return parseYAML(content);
}

// Bad
function loadConfig() {
  return fs.readFile('config.yml', 'utf-8').then(content => {
    return parseYAML(content);
  });
}
```

### File Organization

- One component per file
- Group related functionality
- Use index.ts for public exports
- Keep files under 300 lines

```
src/
  providers/
    MarkdownTreeProvider.ts
    MarkdownEditorProvider.ts
    index.ts              # Export both providers
```

## Testing

### Writing Tests

- Write tests for new features
- Update tests when changing functionality
- Aim for 80%+ code coverage
- Test edge cases and error scenarios

```typescript
// tests/unit/config/ConfigManager.test.ts
describe('ConfigManager', () => {
  describe('load', () => {
    it('should load valid YAML config', async () => {
      const manager = new ConfigManager();
      const config = await manager.load();

      expect(config.sections).toHaveLength(1);
      expect(config.sections[0].id).toBe('specs');
    });

    it('should return default config if file missing', async () => {
      // ...
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- ConfigManager.test.ts

# Watch mode
npm test -- --watch
```

## Documentation

### Code Documentation

- Add JSDoc comments to public functions and classes
- Explain complex algorithms
- Document parameters and return types

```typescript
/**
 * Builds a folder hierarchy from a flat list of files
 *
 * @param files - Array of resolved file objects
 * @returns Root folder node containing the hierarchy
 */
private buildFolderHierarchy(files: ResolvedFile[]): FolderNode {
  // ...
}
```

### User Documentation

- Update README.md for user-facing changes
- Add examples for new features
- Keep documentation synchronized with code
- Update CHANGELOG.md

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if user-facing change)
- [ ] No console.log() or debug code left
- [ ] Branch is up to date with master

### PR Description

Provide a clear description:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] CHANGELOG updated
```

### Review Process

1. Automated checks run (build, tests)
2. Code review by maintainer
3. Address review feedback
4. Approved PR gets merged

## Project Structure

### Extension Host (src/)
- `extension.ts` - Entry point
- `providers/` - VS Code providers
- `commands/` - Command implementations
- `config/` - Configuration management
- `utils/` - Utilities

### Webview (webview/)
- `main.ts` - CodeMirror setup
- `editors/` - Editor mode plugins
- `styles/` - CSS styles

### Key Files
- `package.json` - Extension manifest
- `tsconfig.json` - TypeScript config
- `esbuild.js` - Build configuration

## Feature Requests

To request a feature:

1. Check if it already exists in [Issues](https://github.com/yourusername/fabriqa.ai-markdown-editor/issues)
2. Open a new issue with:
   - Clear description
   - Use cases
   - Expected behavior
   - Mockups/examples (if applicable)

## Bug Reports

To report a bug:

1. Check if already reported
2. Open a new issue with:
   - Bug description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment (OS, VS Code version)
   - Screenshots/logs

## Questions

For questions:
- Check [Documentation](docs/)
- Search [Discussions](https://github.com/yourusername/fabriqa.ai-markdown-editor/discussions)
- Open a new discussion

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

## Need Help?

- Read [DEVELOPMENT.md](docs/DEVELOPMENT.md) for technical details
- Ask in [Discussions](https://github.com/yourusername/fabriqa.ai-markdown-editor/discussions)
- Contact maintainers

Thank you for contributing! 🎉
