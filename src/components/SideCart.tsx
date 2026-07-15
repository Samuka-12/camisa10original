import { X, Minus, Plus, Trash2, Tag, Crown, Truck, Gift } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getUrlWithUtm } from "@/utils/utm";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Subcomponente: Banner da Promoção ─────────────────────────────────────────

interface TripleCrownBannerProps {
  freeItemName: string;
  freeItemPrice: number;
}

function TripleCrownBanner({ freeItemName, freeItemPrice }: TripleCrownBannerProps) {
  return (
    <div
      id="triple-crown-banner"
      role="status"
      aria-live="polite"
      style={{
        background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
        borderRadius: "12px",
        padding: "12px 14px",
        marginBottom: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
        animation: "tcFadeIn 0.4s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Crown size={16} style={{ color: "#fde68a", flexShrink: 0 }} aria-hidden="true" />
        <span
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
            lineHeight: 1.3,
          }}
        >
          🔥 Promoção Tríplice Coroa Aplicada!
        </span>
      </div>

      <p style={{ color: "#f5d0fe", fontSize: "12px", margin: 0, lineHeight: 1.4 }}>
        Você ganhou{" "}
        <strong style={{ color: "#fff" }}>
          1 Manto de graça + Frete Grátis
        </strong>
        .
        <br />
        <span style={{ opacity: 0.85 }}>
          Manto grátis:{" "}
          <span
            style={{
              textDecoration: "line-through",
              marginRight: "4px",
              opacity: 0.7,
            }}
          >
            {BRL.format(freeItemPrice)}
          </span>
          <strong style={{ color: "#86efac" }}>R$ 0,00</strong>
        </span>
      </p>

      <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "20px",
            padding: "3px 10px",
            fontSize: "11px",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          <Gift size={12} aria-hidden="true" />
          {freeItemName.length > 28 ? freeItemName.slice(0, 28) + "…" : freeItemName}
        </span>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "20px",
            padding: "3px 10px",
            fontSize: "11px",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          <Truck size={12} aria-hidden="true" />
          Frete Grátis
        </span>
      </div>

      {/* Keyframe injetado inline (compatível com qualquer bundler) */}
      <style>{`
        @keyframes tcFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────

const SideCart = () => {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalPrice,
    subtotal,
    coupon,
    setCoupon,
    applyCoupon,
    discount,
    totalItems,
    tripleCrown,
  } = useCart();

  // ── Navegação para checkout ────────────────────────────────────────────────

  const getCleanCheckoutUrl = async () => {
    console.log("Iniciando checkout com itens:", items);
    
    // Dispara InitiateCheckout antes de redirecionar
    // Importamos as funções necessárias do metaPixel
    const { trackInitiateCheckout, getFbc, getFbp } = await import("@/lib/metaPixel");
    
    await trackInitiateCheckout({
      value: totalPrice,
      numItems: totalItems,
      contentIds: items.map(i => i.product.id),
      userData: { fbc: getFbc(), fbp: getFbp() }
    });

    const origin = window.location.origin;

    const checkoutUrl = totalItems === 1 
      ? getUrlWithUtm(`${origin}/checkout?id=${items[0].product.id}&qty=${items[0].quantity}`)
      : getUrlWithUtm(`${origin}/checkout?type=cart`);

    // Pequeno delay para garantir que o evento de tracking seja enviado antes do redirecionamento
    setTimeout(() => {
      window.location.href = checkoutUrl;
    }, 100);
  };

  // ── Utilitário: verifica se um item tem unidades gratuitas ─────────────────

  const getFreeEntry = (productId: string, size: string) =>
    tripleCrown.freeItems.find(
      (fi) => fi.productId === productId && fi.size === size
    ) ?? null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col notranslate">
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
            {/* ── Banner da Promoção (exibido quando ativa) ────────────────── */}
            {tripleCrown.isActive && tripleCrown.freeItems[0] && (
              <TripleCrownBanner
                freeItemName={tripleCrown.freeItems[0].name}
                freeItemPrice={tripleCrown.freeItems[0].priceNum}
              />
            )}

            {/* ── Progresso da Promoção (carrinho com 1 ou 2 itens) ────────── */}
            {!tripleCrown.isActive && tripleCrown.totalUnits > 0 && (
              <div
                id="triple-crown-progress"
                style={{
                  background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Crown size={14} style={{ color: "#a78bfa", flexShrink: 0 }} />
                <p style={{ color: "#c4b5fd", fontSize: "12px", margin: 0, lineHeight: 1.4 }}>
                  Falta{" "}
                  <strong style={{ color: "#fff" }}>
                    {3 - tripleCrown.totalUnits}{" "}
                    {3 - tripleCrown.totalUnits === 1 ? "camiseta" : "camisetas"}
                  </strong>{" "}
                  para ativar a{" "}
                  <strong style={{ color: "#f9a8d4" }}>Tríplice Coroa</strong> e ganhar
                  1 manto + Frete Grátis!
                </p>
              </div>
            )}

            {/* ── Lista de itens ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => {
                const freeEntry = getFreeEntry(item.product.id, item.size);
                const unitPrice = Number(item.product.priceNum) || 0;
                const originalLineTotal = unitPrice * item.quantity;
                const freeQty = freeEntry?.freeQuantity ?? 0;
                const paidQty = item.quantity - freeQty;
                const effectiveLineTotal = unitPrice * paidQty;
                const hasDiscount = freeQty > 0;

                return (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    id={`cart-item-${item.product.id}`}
                    className="flex gap-3 p-3 rounded-lg bg-secondary/50"
                    style={
                      hasDiscount
                        ? {
                            outline: "2px solid rgba(167,139,250,0.5)",
                            background: "rgba(124,58,237,0.07)",
                          }
                        : undefined
                    }
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== "/placeholder.svg") {
                            target.src = "/placeholder.svg";
                          }
                        }}
                      />
                      {/* Badge "GRÁTIS" sobre a imagem do item gratuito */}
                      {hasDiscount && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-6px",
                            left: "-6px",
                            background: "linear-gradient(135deg,#7c3aed,#db2777)",
                            color: "#fff",
                            fontSize: "9px",
                            fontWeight: 800,
                            borderRadius: "4px",
                            padding: "2px 5px",
                            letterSpacing: "0.05em",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                          }}
                        >
                          GRÁTIS
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.product.name}
                          </p>

                          <button
                            onClick={() => removeItem(item.product.id, item.size)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Remover produto"
                            aria-label={`Remover ${item.product.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">Tam: {item.size}</p>

                        {/* Indicador de unidades gratuitas */}
                        {hasDiscount && (
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#a78bfa",
                              fontWeight: 600,
                              marginTop: "2px",
                            }}
                          >
                            🎁 {freeQty}× unidade gratuita (Tríplice Coroa)
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Preço: riscado quando há desconto */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          {hasDiscount && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--muted-foreground)",
                                textDecoration: "line-through",
                                opacity: 0.7,
                              }}
                            >
                              {BRL.format(originalLineTotal)}
                            </span>
                          )}
                          <p
                            className="text-sm font-bold"
                            style={{ color: hasDiscount ? "#86efac" : "var(--color-primary)" }}
                          >
                            {BRL.format(effectiveLineTotal)}
                          </p>
                        </div>

                        {/* Controle de quantidade */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.size, item.quantity - 1)
                            }
                            className="p-1 rounded bg-muted hover:bg-muted-foreground/20 transition-colors"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="text-xs font-medium w-4 text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.size, item.quantity + 1)
                            }
                            className="p-1 rounded bg-muted hover:bg-muted-foreground/20 transition-colors"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Rodapé do carrinho ────────────────────────────────────────── */}
            <div className="border-t border-border pt-4 space-y-3">

              {/* Campo de cupom */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="coupon-input"
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Cupom de desconto"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label="Código de cupom"
                  />
                </div>
                <button
                  id="apply-coupon-btn"
                  onClick={applyCoupon}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
                >
                  Aplicar
                </button>
              </div>
              {discount > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  Cupom aplicado! {discount * 100}% de desconto
                </p>
              )}

              {/* Linha de desconto da Tríplice Coroa */}
              {tripleCrown.isActive && (
                <div className="flex justify-between items-center">
                  <span
                    style={{ fontSize: "12px", color: "#a78bfa", fontWeight: 600 }}
                  >
                    👑 Desconto Tríplice Coroa
                  </span>
                  <span
                    style={{ fontSize: "13px", fontWeight: 700, color: "#86efac" }}
                  >
                    −{BRL.format(tripleCrown.totalDiscount)}
                  </span>
                </div>
              )}

              {/* Frete */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Frete</span>
                {tripleCrown.freeShipping ? (
                  <span
                    id="free-shipping-label"
                    style={{ fontSize: "13px", fontWeight: 700, color: "#86efac" }}
                  >
                    Grátis 🚚
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">A calcular</span>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-foreground">Total</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  {tripleCrown.isActive && (
                    <span
                      style={{
                        fontSize: "11px",
                        textDecoration: "line-through",
                        opacity: 0.5,
                        color: "var(--foreground)",
                      }}
                    >
                      {BRL.format(subtotal)}
                    </span>
                  )}
                  <span
                    id="cart-total-price"
                    className="text-xl font-bold text-primary"
                  >
                    {BRL.format(Number(totalPrice) || 0)}
                  </span>
                </div>
              </div>

              <button
                id="checkout-btn"
                type="button"
                onClick={getCleanCheckoutUrl}
                className="block w-full py-4 rounded-lg bg-accent text-accent-foreground font-bold text-base hover:bg-accent/90 transition-colors text-center shadow-lg active:scale-[0.98] mb-2"
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
