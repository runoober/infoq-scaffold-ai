# Delta for User Management

## ADDED Requirements

### Requirement: User Import Workflow
The system MUST support importing users from a template-driven spreadsheet flow within the user-management surface.

#### Scenario: Import entry is available to authorized administrators
- WHEN a user has the `system:user:import` permission
- THEN the user-management page provides an import entry point
- AND unauthorized users do not see or cannot trigger that operation

#### Scenario: Template download guides import preparation
- WHEN an administrator wants to prepare an import file
- THEN the system provides a template download action before upload

### Requirement: User Import Submission
The system MUST submit the import file together with an explicit overwrite flag.

#### Scenario: Submit import without overwrite
- WHEN an administrator uploads a valid Excel file and leaves overwrite disabled
- THEN the request submits the file with `updateSupport=false`

#### Scenario: Submit import with overwrite
- WHEN an administrator uploads a valid Excel file and enables overwrite
- THEN the request submits the file with `updateSupport=true`

### Requirement: User Import Feedback
The system MUST return explicit success or failure feedback for user imports.

#### Scenario: Import succeeds
- WHEN the uploaded file is valid and import processing succeeds
- THEN the system returns an import result summary for administrator review

#### Scenario: Import fails due to validation or parsing issues
- WHEN the uploaded file is invalid, malformed, or fails domain validation
- THEN the system returns an explicit failure message
- AND the UI does not silently swallow the reason
