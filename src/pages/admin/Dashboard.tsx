import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, Search, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  team: string;
  price: number;
  category: string;
  image_url: string;
}

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar produtos");
      console.error(error);
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta camisa?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar produto");
    } else {
      toast.success("Produto deletado com sucesso");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff" }}>
            Catálogo de Camisas
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", marginTop: "4px", fontSize: "14px" }}>
            Gerencie seu inventário e lançamentos
          </p>
        </div>
        <Link to="/admin/produtos/novo">
          <Button
            style={{
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              border: "none",
              fontWeight: 700,
              padding: "12px 24px",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
            }}
            className="flex items-center text-sm font-semibold gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Nova Camisa
          </Button>
        </Link>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Barra de busca */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
          className="flex gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              type="text"
              placeholder="Buscar pelo nome ou seleção..."
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                borderRadius: "10px",
              }}
              className="w-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all placeholder:text-white/25"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <th style={thStyle}>Produto</th>
                <th style={thStyle}>Time/Seleção</th>
                <th style={thStyle}>Categoria</th>
                <th style={thStyle}>Preço</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    Carregando catálogo...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    Nenhum produto cadastrado ainda.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={tdStyle}>
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "10px",
                            background: "rgba(255,255,255,0.05)",
                            overflow: "hidden",
                            flexShrink: 0,
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>
                              Sem Foto
                            </div>
                          )}
                        </div>
                        <span style={{ fontWeight: 600, color: "#fff" }}>{product.name}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: "rgba(255,255,255,0.55)" }}>{product.team}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "rgba(124,58,237,0.15)",
                          color: "#a78bfa",
                          border: "1px solid rgba(124,58,237,0.2)",
                        }}
                      >
                        {product.category}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#86efac" }}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(product.price)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDelete(product.id)}
                          style={{
                            padding: "8px",
                            borderRadius: "8px",
                            border: "none",
                            background: "rgba(239,68,68,0.1)",
                            color: "#f87171",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Estilos da tabela
const thStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "rgba(255,255,255,0.35)",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "14px",
};

export default AdminDashboard;
