# Contributing to Tiktiki (JourneyOS)

Thank you for contributing to Tiktiki! To maintain our high engineering and reliability standards, all contributions must adhere to our Test-Driven Architecture.

---

## 1. Ground Rules & Code Standards
1. **Test-Driven Architecture (TDD)**: Every bug fix or feature must include automated tests (`make test`). Pull requests that decrease code coverage or fail race detection will not be merged.
2. **Strict Privacy & Zero Secrets**: Never commit passwords, live API tokens, or personal identifiers.
3. **No Direct Pushes to `main`**: All code enters `main` exclusively through Pull Requests with at least one approved code owner review and green CI checks.

---

## 2. Development Workflow

```bash
# 1. Clone your fork and branch
git checkout -b feat/your-feature-name

# 2. Start local dependencies
make docker-up

# 3. Run all tests with race detector
make test

# 4. Compile binary
make build
```

---

## 3. Pull Request Requirements
- Complete the Pull Request template checklist.
- Link the relevant issue or PRD section.
- Ensure all CI tests (Go race detection, Node test suite) pass.
