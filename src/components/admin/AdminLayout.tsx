import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogOut, LayoutDashboard, PlusCircle, Shirt } from "lucide-react";

const AdminLayout = () => {
  const { session, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col min-h-[auto] md:min-h-screen">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Shirt className="w-6 h-6 mr-2 text-primary" />
          <span className="text-xl font-bold font-heading text-gray-900">Camisa 10</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-white rounded-full">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <a
            href="/admin"
            className="flex items-center px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            <span className="font-medium">Catálogo</span>
          </a>
          <a
            href="/admin/produtos/novo"
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-3" />
            <span className="font-medium">Nova Camisa</span>
          </a>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={signOut}
            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
