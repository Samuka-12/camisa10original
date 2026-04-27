import { Link, useLocation } from "react-router-dom";

const categories = [
  { label: "Seleções", slug: "selecoes" },
  { label: "Brasileirão", slug: "brasileirao" },
  { label: "Europeus", slug: "europeus" },
  { label: "Históricas", slug: "retro" },
];

const CategoryBar = () => {
  const location = useLocation();

  return (
    <div className="bg-primary">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-0">
          {categories.map((cat) => {
            const isActive = location.pathname === `/categoria/${cat.slug}`;
            return (
              <Link
                key={cat.slug}
                to={`/categoria/${cat.slug}`}
                className={`px-6 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
