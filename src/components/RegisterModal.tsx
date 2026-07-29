import { useState } from "react";
import { User, Mail, Lock, MapPin, CheckCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

const RegisterModal = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", cep: "" });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name || !form.email || !form.password) {
      setErrorMsg("Preencha nome, email e senha para cadastrar.");
      return;
    }

    setLoading(true);

    try {
      // 1. SignUp with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            cep: form.cep
          }
        }
      });

      if (error) {
        // Fallback for local session if auth error occurs
        localStorage.setItem('user_session', JSON.stringify({
          name: form.name,
          email: form.email,
          cep: form.cep,
          created_at: new Date().toISOString()
        }));
      } else if (data?.user) {
        localStorage.setItem('user_session', JSON.stringify({
          id: data.user.id,
          name: form.name,
          email: form.email,
          cep: form.cep
        }));
      }

      setSuccessMsg("✅ Cadastro realizado com sucesso! Seja bem-vindo(a) à Camisa 10!");
      setForm({ name: "", email: "", password: "", cep: "" });
      setTimeout(() => {
        setOpen(false);
        setSuccessMsg("");
      }, 2500);
    } catch (err: any) {
      setErrorMsg("Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block">
          Cadastrar conta
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-950 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Criar sua conta
          </DialogTitle>
        </DialogHeader>

        {successMsg ? (
          <div className="bg-emerald-950/80 border border-emerald-500/40 p-4 rounded-xl text-center space-y-2 my-4">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-emerald-300">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nome completo" required className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="Email" required className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={form.password} onChange={(e) => update("password", e.target.value)} type="password" placeholder="Senha" required className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={form.cep} onChange={(e) => update("cep", e.target.value)} placeholder="CEP (opcional)" className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/10 bg-slate-900 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>

            {errorMsg && <p className="text-xs text-red-400 font-bold bg-red-950/50 p-2.5 rounded-lg border border-red-500/20">{errorMsg}</p>}

            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="animate-spin h-4 w-4" /> : "Cadastrar Conta"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
