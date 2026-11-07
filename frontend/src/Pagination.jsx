
// Componente reutilizable para paginación.
// Props:
//   - total: cantidad total de registros
//   - page: página actual (1-indexed)
//   - pageSize: registros por página
//   - onPageChange: (page) => void
//   - onPageSizeChange: (pageSize) => void
export default function Pagination({ total, page = 1, pageSize = 10, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(page, 1), totalPages);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const start = Math.max(1, clampedPage - 3);
    const end = Math.min(totalPages, start + 6);
    for (let i = start; i <= end; i++) pages.push(i);
  }

  return (
    <div className="pagination">
      <div className="field pagination-size-row">
        <label htmlFor="page-size" className="text-muted">
          Registros por página
        </label>
        <select
          id="page-size"
          className="pagination-select"
          value={pageSize}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n)) {
              onPageSizeChange?.(n);
              onPageChange?.(1);
            }
          }}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <nav className="pagination-nav" aria-label="Número de página">
        <span className="text-muted pagination-note">
          Página {clampedPage}/{totalPages}
        </span>
        <span className="pagination-note">de {total}</span>
      </nav>

      <nav aria-label="Navegación de paginación">
        <button
          type="button"
          disabled={clampedPage === 1}
          className="btn btn-small"
          onClick={() => onPageChange?.(clampedPage - 1)}
        >
          &laquo;
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            disabled={p === clampedPage}
            className={`btn btn-small ${p === clampedPage ? "page-current" : ""}`}
            onClick={() => onPageChange?.(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={clampedPage === totalPages}
          className="btn btn-small"
          onClick={() => onPageChange?.(clampedPage + 1)}
        >
          &raquo;
        </button>
      </nav>
    </div>
  );
}