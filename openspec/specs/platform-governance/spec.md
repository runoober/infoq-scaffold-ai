# Platform Governance Specification

## Purpose

Define the repository's default AI delivery workflow, cross-workspace impact discipline, and archive gate expectations.

## Requirements
### Requirement: OpenSpec Change Workflow
New feature and behavior changes MUST be planned under `openspec/changes/<change-id>/` before implementation begins.

#### Scenario: Starting a new feature change
- WHEN a new feature or behavior change is requested
- THEN the change is initialized in `openspec/changes/<change-id>/`
- AND the change includes a `proposal.md`
- AND implementation does not begin until the acceptance contract is explicit

### Requirement: Cross-Workspace Impact Assessment
Each change MUST explicitly assess backend, React, and Vue impact, even when only one workspace is modified.

#### Scenario: Backend-only change
- WHEN a change modifies only backend code
- THEN `tasks.md` states that React is not impacted and explains why
- AND `tasks.md` states that Vue is not impacted and explains why

#### Scenario: Multi-workspace change
- WHEN a change affects backend, React, and Vue
- THEN `tasks.md` includes concrete implementation and verification items for each impacted workspace

### Requirement: Verification Before Archive
A change MUST not be archived until verification evidence is available for the impacted workspaces.

#### Scenario: Verification complete
- WHEN main-flow verification, targeted tests, and required lint/build checks have passed or have an approved exception
- THEN the change may be considered archive-ready

#### Scenario: Verification blocked
- WHEN any required verification step is blocked or failing
- THEN the change remains active
- AND the blocker is recorded explicitly in the active change artifacts

### Requirement: OpenSpec Default Routing
Repository rules and onboarding docs MUST present OpenSpec as the default workflow for new feature and behavior changes.

#### Scenario: Reading repository instructions
- WHEN a maintainer reads repository workflow rules or onboarding docs
- THEN they are directed to `openspec/project.md`, `openspec/specs/`, and `openspec/changes/<change-id>/`
- AND OpenSpec is described as the default workflow entry

#### Scenario: Starting a new change
- WHEN a new feature, behavior change, or multi-workspace delivery is requested
- THEN the repository routes planning to `openspec/changes/<change-id>/`
- AND the change artifacts become the source of truth for implementation and verification
