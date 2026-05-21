import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogOut, LayoutDashboard, PlusCircle, Shirt } from "lucide-react";

// ─── Background animado com orbs de gradiente flutuante ──────────────────────

// ─── Background Animado Gatuno 171 (Flow / Extasia) ────────────────────────
function AnimatedBackground() {
  // Array para gerar várias notas de dinheiro caindo
  const moneyItems = Array.from({ length: 30 });

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        backgroundColor: "#050505",
      }}
    >
      {/* Gatuno ao fundo em extasia (4 segundos) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.15, // Mantém sutil para não atrapalhar a leitura do admin
        }}
      >
        <img 
          src="/gatuno.jpg" 
          alt="Gatuno"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            animation: "gatunoExtasia 4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            transformOrigin: "center bottom",
          }}
        />
      </div>

      {/* Chuva de Dinheiro */}
      {moneyItems.map((_, i) => {
        const randomLeft = Math.random() * 100;
        const randomDelay = Math.random() * 4;
        const randomDuration = 3 + Math.random() * 4;
        const randomScale = 0.5 + Math.random() * 1.5;
        const isDolar = Math.random() > 0.5;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${randomLeft}%`,
              top: "-10%",
              fontSize: `${24 * randomScale}px`,
              animation: `moneyRain ${randomDuration}s linear ${randomDelay}s infinite`,
              opacity: 0.6,
            }}
          >
            {isDolar ? "💵" : "💸"}
          </div>
        );
      })}

      {/* Grid sutil por cima */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Keyframes */}
      <style>{`
        @keyframes gatunoExtasia {
          0%, 100% {
            transform: scale(1) translateY(0px) rotate(0deg);
            filter: brightness(1) drop-shadow(0 0 20px rgba(255,255,255,0));
          }
          25% {
            transform: scale(1.08) translateY(-10px) rotate(-1deg);
            filter: brightness(1.2) drop-shadow(0 0 40px rgba(255,255,255,0.3));
          }
          50% {
            transform: scale(1.15) translateY(-20px) rotate(2deg);
            filter: brightness(1.4) drop-shadow(0 0 60px rgba(255,255,255,0.5));
          }
          75% {
            transform: scale(1.08) translateY(-10px) rotate(-1.5deg);
            filter: brightness(1.2) drop-shadow(0 0 40px rgba(255,255,255,0.3));
          }
        }

        @keyframes moneyRain {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(120vh) rotate(360deg) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Layout principal ────────────────────────────────────────────────────────

const AdminLayout = () => {
  const { session, isLoading, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020617" }}>
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ position: "relative" }}>
      <AnimatedBackground />

      {/* Sidebar — glassmorphism escuro */}
      <aside
        style={{
          position: "relative",
          zIndex: 10,
          backdropFilter: "blur(24px) saturate(1.5)",
          WebkitBackdropFilter: "blur(24px) saturate(1.5)",
          background: "rgba(15,23,42,0.75)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
        className="w-full md:w-64 flex flex-col min-h-[auto] md:min-h-screen"
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              borderRadius: "8px",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "10px",
              boxShadow: "0 0 20px rgba(124,58,237,0.35)",
            }}
          >
            <Shirt className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Camisa 10
          </span>
          <span
            style={{
              marginLeft: "8px",
              padding: "2px 8px",
              fontSize: "10px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "#fff",
              borderRadius: "20px",
              letterSpacing: "0.05em",
            }}
          >
            ADMIN
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          <a
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.2s",
              color: isActive("/admin") ? "#fff" : "rgba(255,255,255,0.55)",
              background: isActive("/admin")
                ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.15))"
                : "transparent",
              border: isActive("/admin")
                ? "1px solid rgba(124,58,237,0.3)"
                : "1px solid transparent",
            }}
          >
            <LayoutDashboard
              className="w-5 h-5"
              style={{ marginRight: "12px", opacity: isActive("/admin") ? 1 : 0.6 }}
            />
            Catálogo
          </a>
          <a
            href="/admin/produtos/novo"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.2s",
              color: isActive("/admin/produtos")
                ? "#fff"
                : "rgba(255,255,255,0.55)",
              background: isActive("/admin/produtos")
                ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.15))"
                : "transparent",
              border: isActive("/admin/produtos")
                ? "1px solid rgba(124,58,237,0.3)"
                : "1px solid transparent",
            }}
          >
            <PlusCircle
              className="w-5 h-5"
              style={{ marginRight: "12px", opacity: isActive("/admin/produtos") ? 1 : 0.6 }}
            />
            Nova Camisa
          </a>
        </nav>

        {/* Botão Sair */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={signOut}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(239,68,68,0.08)",
              color: "#f87171",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <LogOut className="w-5 h-5" style={{ marginRight: "12px" }} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content — glassmorphism no conteúdo */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          padding: "24px",
        }}
        className="md:p-8"
      >
        {/* Container com vidro para o conteúdo */}
        <div
          style={{
            backdropFilter: "blur(16px) saturate(1.3)",
            WebkitBackdropFilter: "blur(16px) saturate(1.3)",
            background: "rgba(15,23,42,0.45)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "24px",
            minHeight: "calc(100vh - 48px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
