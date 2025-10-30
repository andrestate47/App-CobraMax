
const fetch = require('node-fetch');

async function testPago() {
  console.log('🧪 === PROBANDO API DE PAGOS ===');
  
  try {
    // Simular datos de pago como los del modal
    const pagoData = {
      prestamoId: "test-id",
      monto: 50000,
      observaciones: "Pago de prueba"
    };
    
    console.log('📤 Enviando datos:', pagoData);
    
    const response = await fetch('http://localhost:3000/api/pagos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test'
      },
      body: JSON.stringify(pagoData)
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers.raw());
    
    const result = await response.text();
    console.log('📦 Response body:', result);
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testPago();
