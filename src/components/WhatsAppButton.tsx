/** Botão flutuante de atendimento via WhatsApp. */

import { MessageCircle } from 'lucide-react';
import { useStoreConfig } from '@/contexts/StoreConfigContext';
import { trackContact } from '@/lib/metaPixel';

interface WhatsAppButtonProps {
  /** Número do WhatsApp (somente dígitos, com DDI). Ex.: 5511999999999 */
  phone?: string;
  /** Mensagem pré-preenchida */
  message?: string;
}

const WhatsAppButton = ({ phone, message }: WhatsAppButtonProps) => {
  const { config } = useStoreConfig();
  const wa = config.whatsapp;

  if (!wa?.ativo) return null;

  const finalPhone = phone || wa.numero || '5547983174463';
  const defaultMessage = 'Olá! Vim pelo site da Camisa10 e gostaria de mais informações sobre os produtos.';
  const finalMessage = message || encodeURIComponent(defaultMessage);
  const url = `https://wa.me/${finalPhone}?text=${finalMessage}`;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    // Dispara evento Contact para o Meta Pixel
    trackContact();
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
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'scale(1.1)';
        event.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.7)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'scale(1)';
        event.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.5)';
      }}
    >
      <MessageCircle size={30} color="#fff" fill="#fff" />
    </a>
  );
};

export default WhatsAppButton;
