# Contributing to Mini SaaS

We love your input! We want to make contributing to Mini SaaS as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Pull Request Process

1. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
2. Update the CHANGELOG.md with notes on your changes.
3. The PR will be merged once you have the sign-off of the maintainers.

## Coding Conventions

Start reading our code and you'll get the hang of it. We optimize for readability:

- We use **TypeScript** for type safety
- We use **ESLint** and **Prettier** for code formatting
- We use **kebab-case** for file names
- We use **camelCase** for variables and functions
- We use **PascalCase** for classes and components
- We indent using **2 spaces** (soft tabs)
- We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Example:**

```
feat(analytics): add customer segmentation analysis

Implemented RFM (Recency, Frequency, Monetary) analysis for customer segmentation.
Includes new API endpoints and frontend visualizations.

Closes #123
```

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/REDLANTERNDEV/mini-saas-erp/issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We use GitHub issues to track feature requests. Suggest a feature by [opening a new issue](https://github.com/REDLANTERNDEV/mini-saas-erp/issues/new) with the "feature request" label.

**Great Feature Requests** tend to have:

- A clear and concise description of the problem you're trying to solve
- A description of the solution you'd like
- Alternative solutions you've considered
- Additional context or screenshots

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## Questions?

Don't hesitate to ask questions by opening an issue with the "question" label.

---

Thank you for contributing to Mini SaaS! 🎉
