// Marca del producto: tres barras apiladas (dorado/blanco/dorado).
// El color de la barra central se toma de `color` del contenedor.
export default function BrandMark({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="10" width="14" height="3" rx="1" fill="#D9B25C" />
        <rect x="5" y="5.5" width="10" height="3" rx="1" fill="currentColor" />
        <rect x="7" y="1" width="6" height="3" rx="1" fill="#D9B25C" />
      </svg>
    </span>
  );
}
