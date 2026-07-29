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
        .map(c => ({
          id: c.id,
          label: c.label,
          slug: toUrlSlug(c.slug || c.label)
        }))
    : STATIC_CATEGORIES;

  return (
    <div className="bg-primary relative z-40">
      <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
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

          <div className="h-4 w-[1px] bg-primary-foreground/20 mx-2"></div>

          <SizeChartModal />
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
