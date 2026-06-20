import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-extrabold mb-4">
              CAMISA<span className="text-accent">10</span>
            </h3>
            <p className="text-sm text-background/60 leading-relaxed">
              As melhores camisetas de futebol do mundo. Originais e retrô com entrega para todo o Brasil.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Categorias</h4>
            <ul className="space-y-2.5 text-sm text-background/60">
              <li><Link to="/categoria/selecoes" className="hover:text-accent transition-colors">Seleções</Link></li>
              <li><Link to="/categoria/brasileirao" className="hover:text-accent transition-colors">Brasileirão</Link></li>
              <li><Link to="/categoria/europeus" className="hover:text-accent transition-colors">Europeus</Link></li>
              <li><Link to="/categoria/retro" className="hover:text-accent transition-colors">Retrô</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Informações</h4>
            <ul className="space-y-2.5 text-sm text-background/60">
              <li><a href="#" className="hover:text-accent transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Trocas e Devoluções</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Termos de Uso</a></li>
            </ul>
          </div>

          {/* Contact & Payment */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Contato</h4>
            <ul className="space-y-2.5 text-sm text-background/60">
              <li className="flex items-center gap-2">
                <Instagram size={16} />
                <a 
                  href="https://www.instagram.com/camisa10_og_store" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  @camisa10_og_store
                </a>
              </li>
            </ul>
            <h4 className="font-semibold text-sm uppercase tracking-wider mt-6 mb-3">Pagamento</h4>
            <p className="text-sm text-background/60">Pix • Cartão de Crédito • Boleto</p>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-6 text-center text-xs text-background/40">
          © 2026 Camisa10. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
