# PR 1: Models and Validation

## Changes

- Created Share model (`backend/src/models/share.model.ts`) with percentage validation (0-100)
- Created Shareholder model (`backend/src/models/shareholder.model.ts`) with shares array and totalPercentage virtual
- Added validation middleware (`backend/src/middleware/validateSharePercentage.ts`) to enforce total percentage ≤ 100%
- Updated existing accionista model to be legacy-only

## Testing

- Unit tests for percentage validation
- Integration tests for share creation with validation

## Acceptance Criteria

- Shareholder can have multiple shares
- Each share has number, acquisitionDate, percentage
- Total percentage is read-only and sum of shares
- Cannot exceed 100% total
