# Contributing to TypeFlow

Thank you for your interest in contributing to TypeFlow! This document provides guidelines and instructions for contributing.

[日本語版はこちら](docs/CONTRIBUTING-ja.md)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Clear and descriptive title**
- **Steps to reproduce** the behavior
- **Expected behavior** vs **actual behavior**
- **Screenshots** (if applicable)
- **Environment** (OS, browser, Node.js version)
- **Additional context** (logs, error messages, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Clear and descriptive title**
- **Detailed description** of the proposed enhancement
- **Use case**: Why is this enhancement useful?
- **Possible implementation** (if you have ideas)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Follow the coding style** (see below)
5. **Write or update tests** (if applicable)
6. **Update documentation** if needed
7. **Commit your changes**:
   ```bash
   git commit -m 'Add amazing feature'
   ```
   Use clear, descriptive commit messages
8. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
9. **Open a Pull Request**

### Development Setup

1. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/typeflow.git
   cd typeflow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. **Run type checking**:
   ```bash
   npm run typecheck
   # or
   bun run typecheck
   ```

5. **Run linter**:
   ```bash
   npm run lint
   # or
   bun run lint
   ```

### Coding Style

- **TypeScript**: Follow the existing code style
- **React**: Use functional components with hooks
- **Naming**: Use descriptive names, follow camelCase for variables/functions, PascalCase for components
- **Formatting**: The project uses ESLint and Prettier (if configured)
- **Comments**: Add comments for complex logic
- **i18n**: All user-facing strings should be internationalized (see `src/i18n/`)

### Commit Message Guidelines

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add keyboard shortcut for word management

Implements Cmd+K / Ctrl+K to open the add word dialog.
Fixes #123
```

### Testing

- Test your changes manually in the browser
- Ensure the application works in both English and Japanese
- Test edge cases and error scenarios
- If you add new features, consider adding tests (if test framework is set up)

### Documentation

- Update README.md if you add new features or change existing behavior
- Update CHANGELOG.md with your changes
- Add JSDoc comments for new functions/components
- Update i18n files if you add new user-facing strings

### Internationalization (i18n)

TypeFlow supports English and Japanese. When adding new strings:

1. Add English strings to `src/i18n/locales/en/`
2. Add Japanese strings to `src/i18n/locales/ja/`
3. Use the `useTranslation` hook in components:
   ```tsx
   const { t } = useTranslation('namespace')
   ```

### Project Structure

- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities and type definitions
- `src/i18n/` - Internationalization files
- `docs/` - Documentation

### Questions?

If you have questions, feel free to:
- Open a GitHub Discussion
- Create an issue with the "question" label
- Contact the maintainer

Thank you for contributing to TypeFlow! 🎉

