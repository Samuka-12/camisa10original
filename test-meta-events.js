/**
 * Script de teste local para verificar se os eventos Meta Pixel
 * estão sendo enviados corretamente via /api/meta-capi
 * 
 * Este script simula o comportamento do frontend enviando eventos
 * diretamente para a API local.
 */

const events = [
  {
    name: 'PageView',
    payload: {
      event_name: 'PageView',
      event_id: `PageView_${Date.now()}_${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: 'https://camisa10original.com.br/',
      action_source: 'website',
      user_data: {
        fbc: '',
        fbp: 'fb.1.1234567890.AbCdEfGhIjKlMnOpQrStUvWxYz',
        client_user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      custom_data: {},
    },
  },
  {
    name: 'ViewContent',
    payload: {
      event_name: 'ViewContent',
      event_id: `ViewContent_${Date.now()}_${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: 'https://camisa10original.com.br/produto/abc123',
      action_source: 'website',
      user_data: {
        fbc: '',
        fbp: 'fb.1.1234567890.AbCdEfGhIjKlMnOpQrStUvWxYz',
        client_user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      custom_data: {
        content_ids: ['abc123'],
        content_name: 'Camisa Brasil 2002',
        content_type: 'product',
        value: 109.93,
        currency: 'BRL',
      },
    },
  },
  {
    name: 'AddToCart',
    payload: {
      event_name: 'AddToCart',
      event_id: `AddToCart_${Date.now()}_${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: 'https://camisa10original.com.br/produto/abc123',
      action_source: 'website',
      user_data: {
        fbc: '',
        fbp: 'fb.1.1234567890.AbCdEfGhIjKlMnOpQrStUvWxYz',
        client_user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      custom_data: {
        content_ids: ['abc123'],
        content_name: 'Camisa Brasil 2002',
        content_type: 'product',
        value: 109.93,
        currency: 'BRL',
        contents: [{ id: 'abc123', quantity: 1, item_price: 109.93 }],
      },
    },
  },
  {
    name: 'InitiateCheckout',
    payload: {
      event_name: 'InitiateCheckout',
      event_id: `InitiateCheckout_${Date.now()}_${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: 'https://camisa10original.com.br/checkout?id=abc123&qty=1',
      action_source: 'website',
      user_data: {
        fbc: '',
        fbp: 'fb.1.1234567890.AbCdEfGhIjKlMnOpQrStUvWxYz',
        client_user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      custom_data: {
        value: 135.83,
        num_items: 1,
        content_ids: ['abc123'],
        currency: 'BRL',
      },
    },
  },
];

async function testEvent(event) {
  console.log(`\n📤 Enviando evento: ${event.name} (event_id: ${event.payload.event_id})`);
  
  // Simular chamada à API meta-capi
  // Em produção, isso é chamado via fetch('/api/meta-capi')
  // Aqui testamos diretamente a lógica do handler
  
  const { default: handler } = await import('./api/meta-capi.js');
  
  // Criar mock de request/response
  const mockReq = {
    method: 'POST',
    body: event.payload,
    headers: {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64)',
      'x-forwarded-for': '192.168.1.100',
    },
    socket: { remoteAddress: '192.168.1.100' },
  };
  
  let responseStatus = null;
  let responseBody = null;
  
  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      responseStatus = code;
      return mockRes;
    },
    json: (body) => {
      responseBody = body;
    },
    end: () => {},
  };
  
  await handler(mockReq, mockRes);
  
  console.log(`   Status HTTP: ${responseStatus}`);
  if (responseBody) {
    if (responseBody.capi && responseBody.capi.error) {
      console.log(`   ❌ ERRO META: ${JSON.stringify(responseBody.capi.error)}`);
    } else if (responseBody.capi) {
      console.log(`   ✅ Resposta Meta: ${JSON.stringify(responseBody.capi)}`);
    } else {
      console.log(`   ⚠️  Sem resposta da Meta (token pode estar vazio ou evento não enviado)`);
    }
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('  TESTE DE EVENTOS META PIXEL - Camisa 10');
  console.log('═══════════════════════════════════════════════');
  console.log(`\n🕐 Timestamp: ${new Date().toISOString()}`);
  
  for (const event of events) {
    await testEvent(event);
    // Aguardar 500ms entre eventos para não sobrecarregar
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('  TESTE CONCLUÍDO');
  console.log('═══════════════════════════════════════════════');
}

runAllTests().catch(err => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
