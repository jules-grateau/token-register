<!--
  Sync Impact Report
  ===================
  Version change: N/A → 1.0.0 (Initial ratification)

  Added Principles:
  - I. Code Quality
  - II. Testing Standards
  - III. User Experience Consistency
  - IV. Performance Requirements

  Added Sections:
  - Quality Gates (Section 2)
  - Development Workflow (Section 3)
  - Governance

  Removed Sections: N/A (Initial)

  Templates Status:
  - .specify/templates/plan-template.md ✅ (Constitution Check section compatible)
  - .specify/templates/spec-template.md ✅ (Requirements align with principles)
  - .specify/templates/tasks-template.md ✅ (Task structure supports quality gates)

  Deferred Items: None
-->

# Token Register Constitution

## Core Principles

### I. Code Quality

All code contributions MUST meet the following non-negotiable standards:

- **TypeScript Strictness**: All TypeScript code MUST compile with strict mode enabled. No `any` types permitted except with explicit justification documented inline.
- **Linting Compliance**: All code MUST pass ESLint checks with zero warnings before merge. Disabling rules requires team review.
- **Consistent Patterns**: Follow established patterns in the codebase. New patterns MUST be documented and approved before adoption.
- **Shared Types**: Types shared between frontend and backend MUST be defined in `shared-ts/` package. Duplication of type definitions is prohibited.
- **Error Handling**: All async operations MUST have explicit error handling. Silent failures are prohibited.
- **Code Reviews**: All code changes MUST be reviewed by at least one other developer before merge.

**Rationale**: Consistent code quality reduces maintenance burden, prevents bugs, and enables team members to work effectively across the codebase.

### II. Testing Standards

Testing is MANDATORY for all new functionality:

- **API Coverage**: All API endpoints MUST have unit tests covering success cases, error cases, and edge cases using Jest.
- **Test Independence**: Each test MUST be isolated and independent. Tests MUST NOT depend on execution order or shared mutable state.
- **Test Naming**: Test descriptions MUST clearly state the expected behavior in format: "should [expected behavior] when [condition]".
- **Mocking Strategy**: External dependencies (database, external APIs) MUST be mocked in unit tests. Integration tests MAY use test databases.
- **Regression Tests**: Bug fixes MUST include a regression test that fails before the fix and passes after.
- **Test Maintenance**: Flaky tests MUST be fixed or removed within one sprint. Skipped tests MUST include a TODO with owner and target date.

**Rationale**: Comprehensive testing enables confident refactoring, prevents regressions, and serves as living documentation of expected behavior.

### III. User Experience Consistency

All user-facing changes MUST maintain UI/UX consistency:

- **Design System**: UI components MUST use existing design tokens from `client/src/styles/`. New tokens require justification.
- **Responsive Design**: All UI MUST function correctly on screen widths from 320px to 1920px.
- **Loading States**: All async operations MUST display appropriate loading indicators. Users MUST never face blank screens during data fetching.
- **Error Feedback**: All user-initiated actions that can fail MUST provide clear, actionable error messages in the user's language.
- **Accessibility**: Interactive elements MUST be keyboard-navigable. Color MUST NOT be the sole indicator of state.
- **Internationalization**: All user-visible strings MUST support translation. Hardcoded strings are prohibited.

**Rationale**: Consistent UX builds user trust, reduces training time, and ensures the application remains usable across diverse contexts (events, screen sizes, languages).

### IV. Performance Requirements

Performance is a feature and MUST be actively maintained:

- **API Response Time**: API endpoints MUST respond within 200ms (p95) under normal load for read operations, 500ms for write operations.
- **Frontend Bundle**: The initial JavaScript bundle MUST NOT exceed 500KB gzipped. Code splitting is REQUIRED for non-critical paths.
- **Database Queries**: Database queries MUST be optimized. N+1 query patterns are prohibited. Complex queries MUST include execution plans.
- **Memory Management**: The application MUST NOT have memory leaks. Redux state MUST be cleaned up when components unmount.
- **Startup Time**: The backend MUST be ready to accept requests within 5 seconds of process start.
- **Monitoring**: Performance-critical operations MUST be logged with timing information for monitoring.

**Rationale**: This application runs at events where responsiveness is critical. Slow performance directly impacts user throughput and event success.

## Quality Gates

All changes MUST pass through the following gates before merge:

1. **Pre-Commit Gate**
   - TypeScript compilation succeeds with no errors
   - ESLint passes with zero warnings
   - Prettier formatting applied

2. **CI Pipeline Gate**
   - All existing tests pass
   - New tests added for new functionality
   - Test coverage does not decrease for modified files

3. **Review Gate**
   - Code review approved by at least one team member
   - No unresolved review comments
   - Constitution compliance verified

4. **Pre-Deploy Gate**
   - Build completes successfully for production
   - Environment variables validated
   - Database migrations reviewed (if applicable)

## Development Workflow

### Branch Strategy

- `main` branch MUST always be deployable
- Feature branches MUST follow naming convention: `[issue-number]-[brief-description]`
- Direct commits to `main` are PROHIBITED except for critical hotfixes with post-hoc review

### Commit Standards

- Commit messages MUST be descriptive and reference related issues
- Each commit SHOULD represent a logical unit of work
- Breaking changes MUST be clearly marked in commit messages

### Documentation

- API changes MUST include updated endpoint documentation
- README updates are REQUIRED when setup steps change
- Configuration changes MUST be documented in relevant `.env.example` files

## Governance

### Authority

This constitution supersedes all other development practices for the Token Register project. In cases of conflict, the constitution takes precedence.

### Amendment Process

1. Propose amendment via pull request to this file
2. Document rationale for change
3. Require approval from project maintainers
4. Update version according to semantic versioning:
   - **MAJOR**: Principle removal or fundamental redefinition
   - **MINOR**: New principle or significant expansion of existing guidance
   - **PATCH**: Clarifications, typos, non-semantic refinements
5. Update `LAST_AMENDED_DATE` to amendment merge date

### Compliance Review

- All code reviews MUST include constitution compliance check
- Violations MUST be documented and justified if exception is granted
- Repeated violations warrant team discussion and potential process improvement

### Variance Requests

Exceptions to constitution requirements MUST:
- Be documented in the pull request description
- Include rationale for why the exception is necessary
- Include a plan for eventual compliance (if applicable)
- Be approved by at least two reviewers

**Version**: 1.0.0 | **Ratified**: 2026-02-01 | **Last Amended**: 2026-02-01
