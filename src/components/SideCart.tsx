import { X, Minus, Plus, Trash2, Tag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const SideCart = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, coupon, setCoupon, applyCoupon, discount, totalItems } = useCart();

  const getCleanCheckoutUrl = () => {
    if (items.length === 1) {
      const item = items[0];
      // Se for apenas um item, passa o ID e a quantidade
      window.location.href = `/checkout?id=${item.product.id}&qty=${item.quantity}`;
    } else {
      // Se forem vários itens, passa o total e uma descrição geral
      window.location.href = `/checkout?nome=Carrinho (${totalItems} itens)&preco=${totalPrice}`;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">
            Carrinho ({totalItems} {totalItems === 1 ? "item" : "itens"})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            <div key={`${item.product.id}-${item.size}`} className="flex gap-3 p-3 rounded-lg bg-secondary/50">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded-md"
              />

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>

                    {/* BOTÃO DA LIXEIRA */}
                    <button
                      onClick={() => removeItem(item.product.id, item.size)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Remover produto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Tam: {item.size}</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-primary">
                    {/* Garante que o preço está formatado como moeda */}
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                      className="p-1 rounded bg-muted hover:bg-muted-foreground/20 transition-colors"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>

                    <button
                      onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                      className="p-1 rounded bg-muted hover:bg-muted-foreground/20 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              {/* Coupon */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Cupom de desconto"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  onClick={applyCoupon}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
                >
                  Aplicar
                </button>
              </div>
              {discount > 0 && (
                <p className="text-xs text-green-600 font-medium">Cupom aplicado! {discount * 100}% de desconto</p>
              )}

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">
                  R$ {totalPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <button
                type="button"
                onClick={getCleanCheckoutUrl}
                className="block w-full py-3 rounded-lg bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-colors text-center"
              >
                Finalizar Compra
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SideCart;
