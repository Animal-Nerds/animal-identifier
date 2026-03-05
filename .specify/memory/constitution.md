<!--
Sync Impact Report
- Version change: N/A -> 1.0.0
- Modified principles:
  - New adoption (no previous principles)
  - Added I. Functional Reliability and Resilience
  - Added II. Strict TypeScript Integrity
  - Added III. Modular Frontend Architecture
  - Added IV. Accessibility and Performance Budgets
  - Added V. Automated Quality Gates and Delivery
- Added sections:
  - Technical Standards
  - Delivery Workflow and Quality Gates
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ✅ updated: README.md
  - ✅ updated: .specify/templates/commands/*.md (directory not present; no updates required)
- Follow-up TODOs:
  - None
-->

# Animal Identifier Constitution

## Core Principles

### I. Functional Reliability and Resilience
All user-facing application flows MUST execute without broken links and without uncaught
server failures that return HTTP 500 errors in normal operation. Every user journey MUST
define and implement loading, empty, and error states so edge conditions degrade
gracefully instead of failing silently.

Rationale: Reliable behavior and explicit edge-state handling are minimum expectations for
trustworthy field-use software.

### II. Strict TypeScript Integrity
The codebase MUST compile with strict TypeScript settings enabled. Use of `any` is
prohibited in application code, tests, and shared libraries unless wrapped in a typed
boundary adapter with explicit justification in code review. Generics and TypeScript utility
types MUST be used where they reduce duplication and enforce domain constraints.

Rationale: Strong static typing prevents runtime defects and keeps the data model coherent
as the project grows.

### III. Modular Frontend Architecture
Frontend features MUST be built as modular, reusable components with clear interfaces.
Route files MUST orchestrate composition and data flow rather than embedding large blocks
of duplicated UI or business logic. Shared behavior MUST be extracted into `src/lib` modules
or reusable components.

Rationale: Modular design reduces regression risk, accelerates iteration, and enables
independent testing of UI units.

### IV. Accessibility and Performance Budgets
Every release candidate MUST meet WCAG 2.1 AA requirements for user-facing flows and MUST
maintain Lighthouse scores above 90 for accessibility and performance on primary pages.
If a page does not meet these thresholds, it MUST not be promoted without a documented,
time-bounded exception approved in review.

Rationale: Performance and accessibility are product-quality requirements, not optional
enhancements.

### V. Automated Quality Gates and Delivery
A fully automated CI/CD pipeline MUST run on every merge candidate and on the default
branch. The pipeline MUST include unit tests and critical end-to-end user flows using
Playwright or Cypress, and all required checks MUST pass before deployment.

Rationale: Automated verification ensures predictable delivery and prevents regressions from
reaching users.

## Technical Standards

The default web stack is SvelteKit with strict TypeScript. All changes MUST preserve
deterministic routing behavior, typed contracts between client/server boundaries, and
repeatable local/CI execution. Exceptions to stack or quality constraints MUST be documented
in an ADR prior to implementation.

## Delivery Workflow and Quality Gates

Work MUST begin from a specification containing independently testable user stories,
edge-case behavior, and measurable success criteria. Plans MUST include an explicit
Constitution Check before implementation. Tasks MUST include work for tests,
accessibility/performance validation, and CI/CD updates whenever affected.

Pull requests MUST demonstrate:
1. Evidence of passing unit tests and critical E2E flows.
2. Evidence of accessibility and performance checks for changed user-facing pages.
3. Confirmation that loading, empty, and error states are implemented for impacted journeys.

## Governance

This constitution supersedes ad-hoc project practices. Amendments require:
1. A documented proposal that describes the change and affected principles.
2. Review approval from project maintainers.
3. Synchronized updates to dependent templates and guidance documents in the same change.

Versioning policy:
1. MAJOR for backward-incompatible governance or principle removals/redefinitions.
2. MINOR for new principles/sections or materially expanded guidance.
3. PATCH for wording clarifications and non-semantic edits.

Compliance review expectations:
1. Every plan MUST pass the Constitution Check before implementation starts.
2. Every pull request MUST include evidence that constitutional gates were evaluated.
3. Periodic audits MAY be run against active features; violations MUST be remediated or
   explicitly waived with a time-bounded exception.

**Version**: 1.0.0 | **Ratified**: 2026-03-05 | **Last Amended**: 2026-03-05