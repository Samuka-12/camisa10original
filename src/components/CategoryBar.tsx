import { Link, useLocation } from "react-router-dom";
import SizeChartModal from "./SizeChartModal";
import { useStoreConfig } from "@/contexts/StoreConfigContext";

// Fallback static categories if none configured
const STATIC_CATEGORIES = [
  { id: 'selecoes', label: "Seleções", slug: "selecoes" },
  { id: 'brasileirao', label: "Brasileirão", slug: "brasileirao" },
  { id: 'europeus', label: "Europeus", slug: "europeus" },
  { id: 'retro', label: "Históricas", slug: "retro" },
];

// Convert category slug for URL use (remove accents for URL, keep label as is)
function toUrlSlug(slug: string): string {
  return slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

const CategoryBar = () => {
  const location = useLocation();
  const { config } = useStoreConfig();

  // Use dynamic categories from config if available, otherwise use static fallback
  const dynamicCats = config.categorias;
  const categories = (dynamicCats && dynamicCats.length > 0)
    ? dynamicCats
        .slice()
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
        .map(c => {
          // Fallback de rótulo: se o label vier vazio na config salva,
          // usa o nome padrão da categoria estática (ex.: "Históricas").
          const fallback = STATIC_CATEGORIES.find(
            s => s.id === c.id || toUrlSlug(s.slug) === toUrlSlug(c.slug || '')
          );
          const label = (c.label || '').trim() || fallback?.label || (c.slug || '').trim();
          const slug = toUrlSlug((c.slug || '').trim() || fallback?.slug || label);
          return { id: c.id || slug, label, slug };
        })
        .filter(c => c.label && c.slug)
    : STATIC_CATEGORIES.map(s => ({ ...s }));

  // Garante que categorias padrão ausentes (ex.: "Históricas") continuem visíveis.
  for (const s of STATIC_CATEGORIES) {
    if (!categories.some(c => c.slug === toUrlSlug(s.slug) || c.id === s.id)) {
      categories.push({ id: s.id, label: s.label, slug: toUrlSlug(s.slug) });
    }
  }

  return (
    <div className="bg-primary relative z-40">
      <div className="container mx-auto px-4">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-start md:justify-center gap-0 min-w-max">
            {categories.map((cat) => {
              const isActive = location.pathname === `/categoria/${cat.slug}`;
              return (
                <Link
                  key={cat.id}
                  to={`/categoria/${cat.slug}`}
                  className={`px-6 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}

            {/* Tabela de medidas inline com as categorias (desktop e mobile) */}
            <div className="flex items-center">
              <div className="h-4 w-[1px] bg-primary-foreground/20 mx-2"></div>
              <SizeChartModal variant="bar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
