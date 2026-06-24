# Shareholder Specification

## Purpose

Specifies requirements for managing shareholder share allocations, shareholder entities, and total percentage validation.

## Requirements

### Requirement: Share Entity

The system MUST include a `Share` entity with:

- Unique auto-generated `id`
- `number` (string)
- `acquisitionDate` (date)
- `percentage` (float, 0-100 range)

### Requirement: Shareholder Shares Array

The system MUST add a `shares: Share[]` array field to Shareholder entities.

### Requirement: Total Percentage Calculation

The system MUST compute and enforce:

- Total allocation = sum(shares.percentage)
- Constraint: Total \*MUST\* NOT exceed 100%

### Requirement: Backward Compatibility

The system MUST maintain existing Shareholder `percentage` field but:

- Mark as deprecated: "Obsolete: Use computed total from shares.percentage instead\n"
- Make field READ ONLY

### Requirement: Shareholder API Access

The system MUST implement CRUD endpoints:

- GET/POST/PUT/DELETE /api/shareholders/{id}/shares
- GET/POST/PUT/DELETE /api/shares/{id}
- Must reject validation requests exceeding 100% total percentage

## Use Cases

### Scenario: Add First Share to Shareholder

- GIVEN shareholder123 with empty shares array
- WHEN adding Share(percentage=45.5)
- THEN share gets allocated with id, number, acquisitionDate, percentage=45.5
- AND shares array on shareholder123 contains 1 Share

### Scenario: Exceed 100% Total

- GIVEN shareholder456 with shares containing 0.6 (60%) + 0.6 (60%) → 120%
- WHEN attempting to add Share(percentage=0.3)
- THEN validation rejects with error: "Total allocation cannot exceed 100%"

## Security

- Only admins can create/edit/delete shares
