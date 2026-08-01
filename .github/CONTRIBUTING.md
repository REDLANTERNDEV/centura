# Contributing to Centura

Thanks for your interest in contributing. Bug reports, fixes, features and
documentation improvements are all welcome.

## Getting set up

```bash
git clone https://github.com/<your-fork>/centura.git
cd centura
cp .env.docker.example .env     # set DB_PASSWORD, JWT_SECRET, SESSION_SECRET
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

See the [README](../README.md) for a non-Docker setup and the full configuration
reference.

## Workflow

1. Fork the repository and branch from `main`.
2. Make your change.
3. Run `npm run lint` and `npm run format`.
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/).
5. Open a pull request against `main`, describing what changed and why.

A Husky pre-commit hook runs Prettier and ESLint on staged files, so formatting is
applied automatically. If the hook fails, the underlying lint error needs fixing —
don't bypass it with `--no-verify`.

## Coding conventions

These reflect what the codebase actually does today:

| Area                    | Convention                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                | TypeScript, strict. Components in `components/` use PascalCase filenames.                                                               |
| Backend                 | Plain JavaScript with ES modules. Files use camelCase, suffixed by role — `authController.js`, `orderModel.js`, `customerValidator.js`. |
| Variables and functions | camelCase                                                                                                                               |
| Database columns        | snake_case                                                                                                                              |
| Indentation             | 2 spaces                                                                                                                                |
| Formatting              | Prettier, enforced by the pre-commit hook — don't hand-format                                                                           |

The backend is organised by responsibility: `routes/` define endpoints,
`controllers/` handle requests, `models/` hold SQL, `validators/` check input, and
`middleware/` covers auth, org context, security and error handling. New endpoints
should follow that split rather than putting queries in controllers.

Every query that touches tenant data must be scoped by `org_id`. This is the single
most important rule in the codebase — a missing scope leaks data across tenants.

## Commit messages

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

Example:

```
feat(orders): add partial payment tracking

Adds payment_status transitions between pending, partial and paid, plus the
paid_amount column and its validation.

Closes #123
```

## Tests

There is currently no test runner configured — `apps/backend/tests/` holds a single
manual script. Setting up a proper test suite is an open task, and a PR that adds one
would be very welcome. Until then, describe how you verified your change in the pull
request.

## Reporting bugs

[Open an issue](https://github.com/REDLANTERNDEV/centura/issues/new) with:

- What you expected to happen, and what actually happened
- Steps to reproduce, ideally with a request body or sample data
- Version or commit, and how you're running it (Docker or local)
- Relevant logs — with secrets removed

## Requesting features

Open an issue labelled `feature request` describing the problem you're trying to
solve, not only the solution you have in mind. Alternatives you considered are
useful context.

Note the "Not yet implemented" section of the [README](../README.md) — sales
pipeline, interaction history, supplier management and automated reordering are all
known gaps and good places to start.

## Security

Do not report vulnerabilities in a public issue. Open a
[security advisory](https://github.com/REDLANTERNDEV/centura/security/advisories/new)
instead.

## License

By contributing, you agree that your contributions will be licensed under the
GNU Affero General Public License v3.0.
