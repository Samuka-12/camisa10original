import { useState } from "react";
import { X, User, Mail, Lock, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const RegisterModal = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", cep: "" });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block">
          Cadastrar conta
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Criar sua conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 mt-2">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nome completo" className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="Email" className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={form.password} onChange={(e) => update("password", e.target.value)} type="password" placeholder="Senha" className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={form.cep} onChange={(e) => update("cep", e.target.value)} placeholder="CEP" className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>
          <button type="submit" className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
            Cadastrar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
