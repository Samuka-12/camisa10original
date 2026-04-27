import { useState } from "react";
import { CreditCard, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PaymentMethodsModal = () => {
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [bank, setBank] = useState({ banco: "", agencia: "", conta: "" });

  const inputClass = "w-full px-4 py-3 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden md:block">
          Métodos de pagamento
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Métodos de Pagamento</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="credit" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="credit" className="flex-1 gap-2">
              <CreditCard className="h-4 w-4" /> Cartão de Crédito
            </TabsTrigger>
            <TabsTrigger value="debit" className="flex-1 gap-2">
              <Building2 className="h-4 w-4" /> Débito Automático
            </TabsTrigger>
          </TabsList>
          <TabsContent value="credit">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-3 mt-3">
              <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="Número do cartão" className={inputClass} />
              <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Nome no cartão" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} placeholder="Validade (MM/AA)" className={inputClass} />
                <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} placeholder="CVV" className={inputClass} />
              </div>
              <button type="submit" className="w-full py-3 rounded-lg bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-colors">
                Salvar Cartão
              </button>
            </form>
          </TabsContent>
          <TabsContent value="debit">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-3 mt-3">
              <input value={bank.banco} onChange={(e) => setBank({ ...bank, banco: e.target.value })} placeholder="Nome do banco" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input value={bank.agencia} onChange={(e) => setBank({ ...bank, agencia: e.target.value })} placeholder="Agência" className={inputClass} />
                <input value={bank.conta} onChange={(e) => setBank({ ...bank, conta: e.target.value })} placeholder="Conta" className={inputClass} />
              </div>
              <button type="submit" className="w-full py-3 rounded-lg bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-colors">
                Salvar Dados
              </button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodsModal;
