/**
 * WhatsAppButton — Botão flutuante de atendimento via WhatsApp (X1)
 *
 * Estratégia de rastreamento:
 *  - Ao clicar, dispara o evento `Contact` no Meta Pixel (browser) e na
 *    API de Conversões (server-side), registrando a saída do site para o
 *    WhatsApp X1 com o parâmetro source='whatsapp_x1'.
 *  - O evento fica persistido na tabela `meta_events` do Supabase para
 *    análise do funil: Meta Ads → Site → WhatsApp X1.
 */

import { MessageCircle } from 'lucide-react';
import { trackWhatsAppContact, getFbc, getFbp } from '@/lib/metaPixel';

// Número do WhatsApp X1 — altere aqui se necessário
const WHATSAPP_NUMBER = '5547983174463';
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! Vim pelo site da Camisa10 e gostaria de mais informações sobre os produtos.'
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

interface WhatsAppButtonProps {
  /** Número do WhatsApp (somente dígitos, com DDI). Ex: 5511999999999 */
  phone?: string;
  /** Mensagem pré-preenchida */
  message?: string;
  /** Fonte do clique para rastreamento (padrão: 'whatsapp_x1') */
  source?: string;
}

const WhatsAppButton = ({
  phone = WHATSAPP_NUMBER,
  message = WHATSAPP_MESSAGE,
  source = 'whatsapp_x1',
}: WhatsAppButtonProps) => {
  const url = `https://wa.me/${phone}?text=${message}`;

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Dispara evento Contact no Meta Pixel + CAPI
    await trackWhatsAppContact({
      source,
      userData: {
        fbc: getFbc(),
        fbp: getFbp(),
      },
    });

    // Abre o WhatsApp após registrar o evento
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <a
      href={url}
      onClick={handleClick}
      aria-label="Falar com atendimento via WhatsApp"
      title="Atendimento via WhatsApp"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: '#25D366',
        boxShadow: '0 4px 16px rgba(37,211,102,0.5)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(37,211,102,0.7)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(37,211,102,0.5)';
      }}
    >
      <MessageCircle size={30} color="#fff" fill="#fff" />
    </a>
  );
};

export default WhatsAppButton;
