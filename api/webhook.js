/**
 * Rota legada da IronPay.
 *
 * Mantém compatibilidade com postbacks já configurados em /api/webhook, mas usa
 * exatamente a mesma implementação idempotente de /api/ironpay/webhook.
 */

export { default } from './ironpay/webhook.js';
