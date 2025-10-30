
const testCliente = async () => {
  console.log('🧪 Testeando creación de cliente con nuevos campos...')
  
  const nuevoClienteData = {
    codigoCliente: "TEST001",
    documento: "12345678901",
    nombre: "Juan",
    apellido: "Pérez",
    direccionCliente: "Calle 123 #45-67, Barrio Centro",
    direccionCobro: "Carrera 15 #23-45, Oficina",
    telefono: "3001234567",
    referenciasPersonales: "María García: 3009876543, Carlos López: 3001112233",
    pais: "Colombia",
    ciudad: "Bogotá"
  }
  
  try {
    console.log('📤 Enviando datos del cliente:', JSON.stringify(nuevoClienteData, null, 2))
    
    const response = await fetch('http://localhost:3000/api/clientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nuevoClienteData),
    })
    
    if (response.ok) {
      const cliente = await response.json()
      console.log('✅ Cliente creado exitosamente:', JSON.stringify(cliente, null, 2))
    } else {
      const error = await response.json()
      console.error('❌ Error al crear cliente:', error)
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error)
  }
}

testCliente()
