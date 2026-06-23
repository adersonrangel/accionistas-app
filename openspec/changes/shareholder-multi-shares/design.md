# Shareholder Multi‑Shares Design

## 1. Overview

This change adds support for multiple shares per shareholder while preserving the legacy single‑percentage field. It introduces a new **Share** entity, extends the **Shareholder** entity, implements a set of CRUD REST endpoints, enforces percentage limits, provides admin‑only write access, and outlines a migration strategy to keep the API backward compatible.

## 2. Schema Design

### 2.1 Share Entity

```ts
interface Share {
  /**
   * Auto‑generated UUIDv4.
   */
  id: string;

  /**
   * Arbitrary alphanumeric share identifier (e.g., "ABC123").
   */
  number: string;

  /**
   * The date the shareholder acquired the share.
   */
  acquisitionDate: string; // ISO‑8601 date

  /**
   * Allocation percentage for this share.
   * Must be between 0.0 and 100.0, inclusive, with up to 4 decimal places.
   */
  percentage: number;
}
```

### 2.2 Shareholder Entity (Entity Update)

```ts
interface Shareholder {
  id: string;
  name: string;
  // Legacy lump‑sum percentage – retained for read‑only purposes only.
  percentage?: number; // Deprecated → read‑only, derived value.
  // New multi‑share array
  shares: Share[];
  /**
   * Computed read‑only property.
   * Sum of all share percentages, rounded to four decimal places.
   */
  totalPercentage: number;
}
```

- `percentage` remains to satisfy older clients; it is marked **DEPRECATED** and will be exposed as read‑only in the API response.
- `totalPercentage` is calculated server‑side and sent to clients; clients should use this instead of reading `percentage`.

## 3. API Design

All routes are JSON‑based and return 200/201 for success, 400 for validation errors, and 403 for unauthorized attempts.

### 3.1 Shareholder Shares CRUD

| Method | Path | Description | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|---|
| GET | `/api/shareholders/:shareholderId/shares` | Return all shares for a shareholder. | Admin, Viewer | N/A | 200 Success – array of `Share` | The list is ordered by `acquisitionDate` descending. |
| POST | `/api/shareholders/:shareholderId/shares` | Create a new share. | Admin | `{ number, acquisitionDate, percentage }` | 201 Created – new `Share` object | Validation: `percentage` > 0 and total ≤100%. |
| PUT | `/api/shareholders/:shareholderId/shares/:shareId` | Update an existing share. | Admin | `{ number?, acquisitionDate?, percentage? }` | 200 Success – updated `Share` | Partial updates allowed; percent recalculated. |
| DELETE | `/api/shareholders/:shareholderId/shares/:shareId` | Delete a share. | Admin | N/A | 204 No Content | |

### 3.2 General Share CRUD (Legacy Single Share API)

| Method | Path | Description | Auth | Request Body | Response |
|---|---|---|---|---|---|
| GET | `/api/shares/:shareId` | Retrieve a specific share. | All | N/A | 200 Success – `Share` |
| POST | `/api/shares` | Create a generic share that attaches to a shareholder via query `shareholderId`. | Admin | `{ shareholderId, number, acquisitionDate, percentage }` | 201 Created – `Share` |
| PUT | `/api/shares/:shareId` | Update a generic share. | Admin | `{ number?, acquisitionDate?, percentage? }` | 200 Success – `Share` |
| DELETE | `/api/shares/:shareId` | Delete a generic share. | Admin | N/A | 204 No Content |

**Note**: The generic share endpoints are kept to support older code paths but redirect internally to the nested shareholder routes.

## 4. Validation Logic

1. When creating or updating a share, load all current shares for the shareholder.
2. Compute `newTotal = currentTotal - oldSharePercentage + newSharePercentage` (for updates) or `newTotal = currentTotal + newSharePercentage` (for create).
3. If `newTotal > 100.0`, reject with `422 Unprocessable Entity` and error message *"Total allocation cannot exceed 100%"*.
4. Enforce `percentage` in range `[0.0, 100.0]` on each share individually.
5. On delete, recalculate `totalPercentage` and return updated shareholder details.

## 5. Authentication / Authorization

- All write routes (`POST`, `PUT`, `DELETE`) are protected by `adminOnly` middleware which checks the JWT `role` claim equals **`admin`**.
- Read routes are available to all authenticated users. Optionally, implement `viewerOnly` for stricter systems.
- Use existing `authenticateJwt` middleware chain.

## 6. Migration Strategy

The change must be backward compatible with legacy clients that still send/expect a flat `percentage` field on `Shareholder`.

1. **Database Layer**
   - Add a new `shares` collection/table with `shareholderId` FK.
   - Keep the legacy `percentage` column but mark as **DRAFT**. No writes.
   - Add a database view or computed column `total_percentage` = `SUM(shares.percentage)`.
2. **API Layer**
   - On GET `/shareholders/:id`, include both `totalPercentage` and legacy read‑only `percentage`.
   - Mark `percentage` in the OpenAPI spec with `x-deprecated: true`.
   - Response example:

     ```json
     {
       "id":"sh123",
       "name":"ACME Corp",
       "percentage":0, // legacy, always 0
       "totalPercentage": 87.5,
       "shares": [ ... ]
     }
     ```

3. **Data Consistency**
   - On startup, run a cron job that flushes any `percentage` field values into the `shares` array if the shareholder currently has no shares. The cron can use the legacy value to create a single `Share` with that percentage and an autogenerated number.
4. **Deprecation Path**
   - After 30 days of running the migration script, set `percentage` field to `null` in DB and remove it from API responses.

## 7. Schema Migrations (SQL for PostgreSQL)

```sql
-- 1. Add shares table
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID REFERENCES shareholders(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  acquisition_date DATE NOT NULL,
  percentage NUMERIC(5,4) NOT NULL CHECK (percentage >= 0.0 AND percentage <= 100.0)
);

-- 2. Add computed total percentage column to shareholders (virtual)
ALTER TABLE shareholders ADD COLUMN total_percentage NUMERIC(5,4) GENERATED ALWAYS AS (
  (SELECT COALESCE(SUM(s.percentage), 0) FROM shares s WHERE s.shareholder_id = shareholders.id)
) STORED;

-- 3. Backfill legacy percentage records to shares table
INSERT INTO shares (shareholder_id, number, acquisition_date, percentage)
SELECT id, CONCAT('LEGACY-', id), CURRENT_DATE, percentage FROM shareholders WHERE percentage IS NOT NULL;

-- 4. Set legacy percentage to NULL (read‑only)
UPDATE shareholders SET percentage = NULL;
```

## 8. Testing Strategy

- **Unit tests** for validation functions ensuring totals cannot exceed 100%.
- **Integration tests** for each API endpoint (CRUD flows) verifying auth middleware, percentage calculations, and legacy field handling.
- **Regression tests** to confirm legacy GET still returns read‑only legacy percentage.

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Legacy clients might send `percentage` on writes (PUT/POST). | Data divergence | Ignore the field on write requests; reject with 400 if provided. |
| Large number of shares per shareholder may impact performance of totals. | Slow queries | Use an indexed materialized view for `total_percentage`. |
| Migration script mis‑assignes share numbers. | Integrity loss | Use deterministic `number` format `LEGACY-{shareholderId}` and log events. |
| Race condition when two admins update shares simultaneously. | Over‑65% | Enforce database row locks or apply optimistic concurrency via `updated_at` timestamps.

---

## 10. Implementation Notes

1. Use TypeScript interfaces in `src/models/share.model.ts` and `src/models/shareholder.model.ts`.
2. Update `src/routes/shareholder.routes.ts` and add new `src/routes/share.routes.ts`.
3. Implement validation middleware in `src/validation/share.validator.ts`.
4. All database access via TypeORM or Prisma with transaction support.
5. Update OpenAPI / Swagger documentation to include new endpoints and deprecated `percentage` field.

---

**End of Design**
