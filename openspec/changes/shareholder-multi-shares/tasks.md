## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 550-580 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (models & validation) → PR 2 (API routes & middleware) → PR 3 (migration & tests) |
| Delivery strategy | auto-chain / single‑pr (if < 450 lines) |
| Chain strategy | feature‑branch‑chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature‑branch‑chain
400-line budget risk: Medium

---

## Implementation Tasks

- [ ] 1. **Create Share model/schema**
  - *File*: `src/models/share.model.ts`
  - *Changes*: define Mongoose schema with fields: `id`, `number`, `acquisitionDate`, `percentage` (0–100)
  - *TDD*:
    - **RED**: write test expecting validation failure when `percentage` > 100
    - **GREEN**: add validation to schema, test passes
    - **TRIANGULATE**: test create with valid data
  - *Estimated effort*: **≈ 45 added lines**

1. **Update Shareholder model**
   - *File*: `src/models/shareholder.model.ts`
   - *Changes*: add `shares` array of ObjectId refs, add virtual `totalPercentage`, deprecate legacy `percentage` field as read‑only
   - *TDD*:
     - **RED**: attempt to read/write legacy `percentage` and expect error
     - **GREEN**: confirm virtual field computes correctly when shares exist
     - **TRIANGULATE**: test serialization includes only read‑only legacy `percentage` and `totalPercentage`
   - *Estimated effort*: **≈ 35 added lines**

2. **Add percentage validation middleware**
   - *File*: `src/middleware/validateSharePercentage.ts`
   - *Changes*: calculate current total, reject if new addition/updating causes > 100%, ensure individual `percentage` within range
   - *TDD*:
     - **RED**: mock request with 110 % share, expect 422
     - **GREEN**: correct middleware passes
     - **TRIANGULATE**: test partial update scenario
   - *Estimated effort*: **≈ 70 added lines**

3. **Create admin‑only auth middleware**
   - *File*: `src/middleware/adminOnly.ts`
   - *Changes*: check JWT `role` claim equals `admin`, otherwise 403
   - *TDD*:
     - **RED**: request with non‑admin role, expect 403
     - **GREEN**: admin request passes
     - **TRIANGULATE**: ensure route chaining order
   - *Estimated effort*: **≈ 20 added lines**

4. **Implement Share CRUD routes**
   - *File*: `src/routes/share.routes.ts`
   - *Changes*: add `GET /shares/:id`, `POST /shares`, `PUT /shares/:id`, `DELETE /shares/:id` with admin guards and validation
   - *TDD*:
     - **RED**: call POST without auth → 401, without admin → 403
     - **GREEN**: successful CRUD flow
     - **TRIANGULATE**: ensure side‑effects on shareholder totals
   - *Estimated effort*: **≈ 60 added lines**

5. **Implement Shareholder‑Shares nested routes**
   - *File*: `src/routes/shareholderShares.routes.ts`
   - *Changes*: `GET /shareholders/:id/shares`, `POST /shareholders/:id/shares`, `PUT /shareholders/:id/shares/:shareId`, `DELETE /shareholders/:id/shares/:shareId`
   - *TDD*:
     - **RED**: call POST without valid percentage → 400
     - **GREEN**: successful CRUD with admin guard
     - **TRIANGULATE**: validates total allocation logic
   - *Estimated effort*: **≈ 55 added lines**

6. **Migration script to backfill legacy `percentage` into shares**
   - *File*: `src/migrations/migrate-legacy-shares.ts`
   - *Changes*: for shareholders with legacy `percentage`, insert one Share record with that percentage and a generated number
   - *TDD*:
     - **RED**: simulate migration on in‑memory DB, expect error if legacy missing
     - **GREEN**: migration runs successfully
     - **TRIANGULATE**: ensure no duplicate shares created
   - *Estimated effort*: **≈ 80 added lines**

7. **Unit tests for validation logic**
   - *Files*: `test/middleware/validateSharePercentage.test.ts`
   - *Changes*: tests covering boundary cases, concurrent updates
   - *Estimated effort*: **≈ 40 added lines**

8. **Integration tests for all CRUD endpoints**
   - *Files*: `test/integration/share.endpoints.test.ts`, `test/integration/shareholderShares.endpoints.test.ts`
   - *Changes*: full CRUD flow with auth middleware, percentage validation
   - *Estimated effort*: **≈ 80 added lines**

9. **Update frontend/type definitions**
    - *Files*: `src/types/Share.ts`, update existing interfaces
    - *Estimated effort*: **≈ 30 added lines**

## Total Estimated Changed Lines

- Rough Sum: **≈ 555 lines**
- > 400‑line budget risk: **Medium**; split into the three chained PRs suggested above.
