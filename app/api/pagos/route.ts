
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Decimal } from "@prisma/client/runtime/library"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 === API PAGOS POST INICIADO ===')
    
    const session = await getServerSession(authOptions)
    console.log('🔐 Sesión válida:', !!session)
    console.log('🔐 Usuario ID:', session?.user?.id)
    console.log('🔐 Usuario rol:', session?.user?.role)
    
    if (!session) {
      console.log('❌ No hay sesión válida')
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
      console.log('📦 Body recibido:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.log('❌ Error parsing JSON body:', parseError)
      return NextResponse.json(
        { error: "Los datos enviados no son válidos. Intenta nuevamente" },
        { status: 400 }
      )
    }
    
    const { prestamoId, monto, observaciones } = body || {}

    // Validaciones básicas
    if (!prestamoId || !monto) {
      console.log('❌ Faltan datos obligatorios')
      return NextResponse.json(
        { error: "El préstamo y el monto del pago son obligatorios" },
        { status: 400 }
      )
    }

    // Validar que el monto sea un número válido y positivo
    const montoNumerico = parseFloat(monto)
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      console.log('❌ Monto inválido:', monto)
      return NextResponse.json(
        { error: "El monto debe ser un número positivo mayor a cero" },
        { status: 400 }
      )
    }

    // Validar que el monto no sea excesivamente grande (más de 1 billón)
    if (montoNumerico > 1000000000000) {
      console.log('❌ Monto demasiado grande:', monto)
      return NextResponse.json(
        { error: "El monto ingresado es demasiado grande. Verifica la cantidad" },
        { status: 400 }
      )
    }

    // Validar que prestamoId sea una cadena válida
    if (typeof prestamoId !== 'string' || prestamoId.trim().length === 0) {
      console.log('❌ PrestamoId inválido:', prestamoId)
      return NextResponse.json(
        { error: "ID de préstamo no válido" },
        { status: 400 }
      )
    }

    // Validar userId de la sesión
    if (!session.user?.id || typeof session.user.id !== 'string') {
      console.log('❌ UserId de sesión inválido:', session.user?.id)
      return NextResponse.json(
        { error: "Sesión de usuario no válida. Por favor vuelve a iniciar sesión" },
        { status: 401 }
      )
    }

    // Verificar si el día está cerrado (solo para cobradores)
    if (session.user.role === "COBRADOR") {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      const cierreHoy = await prisma.cierreDia.findUnique({
        where: { fecha: hoy }
      })

      if (cierreHoy) {
        return NextResponse.json(
          { error: "No se pueden registrar pagos después del cierre del día" },
          { status: 403 }
        )
      }
    }

    // Verificar que el préstamo existe y está activo
    const prestamo = await prisma.prestamo.findUnique({
      where: { id: prestamoId },
      include: { 
        cliente: true,
        pagos: {
          orderBy: { fecha: 'desc' },
          take: 1
        }
      }
    })

    if (!prestamo) {
      return NextResponse.json(
        { error: "Préstamo no encontrado" },
        { status: 404 }
      )
    }

    if (prestamo.estado !== "ACTIVO") {
      return NextResponse.json(
        { error: "No se pueden registrar pagos en un préstamo inactivo" },
        { status: 400 }
      )
    }

    // Calcular saldo pendiente antes de crear el pago para validar
    console.log('🔢 Calculando saldo pendiente actual...')
    const pagosExistentes = await prisma.pago.aggregate({
      where: { prestamoId },
      _sum: { monto: true }
    })

    const montoOriginalPrestamo = Number(prestamo.monto)
    const tasaInteresPrestamo = Number(prestamo.interes) / 100
    const montoTotalPrestamo = montoOriginalPrestamo * (1 + tasaInteresPrestamo)
    const totalPagosExistentes = Number(pagosExistentes._sum.monto || 0)
    const saldoActual = Math.max(0, montoTotalPrestamo - totalPagosExistentes)

    console.log('💰 Validación de saldo:')
    console.log('  - Monto total préstamo:', montoTotalPrestamo)
    console.log('  - Total pagos existentes:', totalPagosExistentes)
    console.log('  - Saldo actual:', saldoActual)
    console.log('  - Monto a pagar:', montoNumerico)

    // Validar que el pago no exceda el saldo pendiente
    if (montoNumerico > saldoActual) {
      console.log('❌ Pago excede saldo pendiente')
      return NextResponse.json(
        { 
          error: `El monto del pago ($${montoNumerico.toLocaleString('es-CO')}) no puede ser mayor al saldo pendiente ($${saldoActual.toLocaleString('es-CO')})` 
        },
        { status: 400 }
      )
    }

    // Validar que haya saldo pendiente (préstamo no esté ya pagado)
    if (saldoActual <= 0) {
      console.log('❌ No hay saldo pendiente')
      return NextResponse.json(
        { error: "Este préstamo ya está completamente pagado" },
        { status: 400 }
      )
    }

    console.log('💾 Creando pago en BD...')
    console.log('💰 Monto a guardar:', montoNumerico, typeof montoNumerico)
    console.log('💰 PrestamoId:', prestamoId, typeof prestamoId)
    console.log('👤 UserId:', session.user.id, typeof session.user.id)
    
    // Crear el pago usando el constructor Decimal de Prisma para mayor compatibilidad
    let montoDecimal: Decimal
    try {
      montoDecimal = new Decimal(montoNumerico)
      console.log('💰 MontoDecimal creado:', montoDecimal.toString())
    } catch (decimalError) {
      console.log('❌ Error creando Decimal:', decimalError)
      return NextResponse.json(
        { error: "Error en el formato del monto. Por favor verifica que sea un número válido" },
        { status: 400 }
      )
    }
    
    let pago
    try {
      pago = await prisma.pago.create({
        data: {
          prestamoId,
          userId: session.user.id,
          monto: montoDecimal, // Pasar como objeto Decimal
          observaciones: observaciones?.trim() || null
        },
        include: {
          prestamo: {
            include: {
              cliente: true
            }
          },
          usuario: {
            select: {
              firstName: true,
              lastName: true,
              name: true
            }
          }
        }
      })
    } catch (pagoError) {
      console.error('❌ Error específico creando pago:', pagoError)
      
      if (pagoError instanceof Error) {
        // Error específico de validación de Decimal
        if (pagoError.message.includes('Decimal') || pagoError.message.includes('Invalid')) {
          console.log('🔍 Error de Decimal detectado:', pagoError.message)
          return NextResponse.json(
            { error: "Error en el formato del monto. Por favor verifica que sea un número válido" },
            { status: 400 }
          )
        }
        
        // Error de foreign key (prestamoId o userId inválidos)
        if (pagoError.message.includes('Foreign key constraint')) {
          console.log('🔍 Error de clave foránea detectado:', pagoError.message)
          return NextResponse.json(
            { error: "Error de referencia de datos. Por favor verifica el préstamo e intenta nuevamente" },
            { status: 400 }
          )
        }
      }
      
      // Re-lanzar el error para que sea manejado por el catch principal
      throw pagoError
    }

    console.log('✅ Pago creado en BD')
    console.log('📄 ID pago:', pago.id)
    console.log('💰 Monto pago:', pago.monto)
    console.log('👤 Cliente:', pago.prestamo?.cliente?.nombre)

    // Calcular nuevo saldo pendiente después de crear el pago
    console.log('🔢 Recalculando saldo pendiente después del pago...')
    const nuevoSaldoPendiente = Math.max(0, saldoActual - montoNumerico)

    console.log('🔢 Cálculos finales:')
    console.log('  - Saldo antes del pago:', saldoActual)
    console.log('  - Monto del pago:', montoNumerico)
    console.log('  - Nuevo saldo pendiente:', nuevoSaldoPendiente)

    const numeroBoleta = `BOL-${String(pago.id).padStart(6, '0')}`
    console.log('📄 Número de boleta generado:', numeroBoleta)

    // Obtener el último pago anterior para incluir en la boleta
    const ultimoPagoAnterior = prestamo.pagos.length > 0 && prestamo.pagos[0].id !== pago.id 
      ? prestamo.pagos[0] 
      : null;

    const responseData = {
      message: "Pago registrado exitosamente",
      pago: {
        id: pago.id,
        monto: Number(pago.monto),
        fecha: pago.fecha,
        observaciones: pago.observaciones,
        numeroBoleta: numeroBoleta,
        prestamo: {
          id: prestamo.id,
          monto: montoOriginalPrestamo,
          interes: Number(prestamo.interes),
          valorCuota: Number(prestamo.valorCuota),
          montoTotal: montoTotalPrestamo,
          saldoPendiente: nuevoSaldoPendiente,
          fechaInicio: prestamo.fechaInicio,
          tipoPago: prestamo.tipoPago,
          cuotas: prestamo.cuotas,
          microseguroTipo: prestamo.microseguroTipo,
          microseguroValor: Number(prestamo.microseguroValor),
          microseguroTotal: Number(prestamo.microseguroTotal),
          ultimoPago: ultimoPagoAnterior ? {
            fecha: ultimoPagoAnterior.fecha,
            monto: Number(ultimoPagoAnterior.monto)
          } : undefined
        },
        cliente: {
          nombre: pago.prestamo.cliente.nombre,
          apellido: pago.prestamo.cliente.apellido,
          documento: pago.prestamo.cliente.documento,
          telefono: pago.prestamo.cliente.telefono,
          direccionCliente: pago.prestamo.cliente.direccionCliente
        },
        usuario: {
          nombre: pago.usuario.firstName && pago.usuario.lastName 
            ? `${pago.usuario.firstName} ${pago.usuario.lastName}`
            : pago.usuario.name || "Usuario"
        },
        // Campos adicionales para la boleta mejorada
        tipoCredito: prestamo.tipoCredito.toLowerCase(),
        tipoPagoMetodo: 'efectivo' // Por defecto, se puede personalizar más adelante
      }
    }

    console.log('📤 RESPONSE COMPLETA DE LA API:')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('🏁 Enviando response exitosa')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ Error al registrar pago:", error)
    console.error("❌ Stack trace completo:", error instanceof Error ? error.stack : 'No disponible')
    
    // Manejar diferentes tipos de errores específicamente
    if (error instanceof Error) {
      console.log('📋 Analizando tipo de error:', error.message)
      
      // Error de validación de Prisma
      if (error.message.includes('Unique constraint')) {
        console.log('🔍 Error de constraint único detectado')
        return NextResponse.json(
          { error: "Ya existe un registro con estos datos" },
          { status: 400 }
        )
      }
      
      // Error de conexión a base de datos
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        console.log('🔍 Error de conexión detectado')
        return NextResponse.json(
          { error: "Problema de conexión. Intenta nuevamente en unos momentos" },
          { status: 503 }
        )
      }
      
      // Error de validación de Prisma (incluye Decimal)
      if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('Expected') || error.message.includes('validation')) {
        console.log('🔍 Error de validación de Prisma detectado')
        return NextResponse.json(
          { error: "Error en la validación de datos. Por favor verifica la información ingresada" },
          { status: 400 }
        )
      }
      
      // Error de cast o conversión
      if (error.message.includes('cast') || error.message.includes('convert') || error.message.includes('Decimal')) {
        console.log('🔍 Error de conversión de datos detectado')
        return NextResponse.json(
          { error: "Error en el formato de los datos. Verifica que el monto sea un número válido" },
          { status: 400 }
        )
      }
      
      // Error de sesión o autenticación
      if (error.message.includes('session') || error.message.includes('auth')) {
        console.log('🔍 Error de sesión detectado')
        return NextResponse.json(
          { error: "Tu sesión ha expirado. Por favor recarga la página e intenta nuevamente" },
          { status: 401 }
        )
      }
    }
    
    // Error genérico pero más amigable
    console.log('🔍 Error genérico no categorizado')
    return NextResponse.json(
      { error: "Error interno del servidor. Por favor intenta nuevamente o contacta al administrador" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")
    const prestamoId = searchParams.get("prestamoId")

    let whereCondition: any = {}

    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      
      whereCondition.fecha = {
        gte: fechaInicio,
        lte: fechaFin
      }
    }

    if (prestamoId) {
      whereCondition.prestamoId = prestamoId
    }

    const pagos = await prisma.pago.findMany({
      where: whereCondition,
      include: {
        prestamo: {
          include: {
            cliente: true
          }
        },
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        }
      },
      orderBy: {
        fecha: "desc"
      }
    })

    const pagosFormateados = pagos.map(pago => ({
      id: pago.id,
      monto: Number(pago.monto),
      fecha: pago.fecha,
      observaciones: pago.observaciones,
      modificado: pago.modificado,
      prestamo: {
        id: pago.prestamo.id,
        monto: Number(pago.prestamo.monto),
        cliente: {
          nombre: pago.prestamo.cliente.nombre,
          apellido: pago.prestamo.cliente.apellido,
          documento: pago.prestamo.cliente.documento
        }
      },
      usuario: {
        nombre: pago.usuario.firstName && pago.usuario.lastName 
          ? `${pago.usuario.firstName} ${pago.usuario.lastName}`
          : pago.usuario.name || "Usuario"
      }
    }))

    return NextResponse.json(pagosFormateados)
  } catch (error) {
    console.error("❌ Error al obtener pagos:", error)
    
    // Manejar diferentes tipos de errores específicamente
    if (error instanceof Error) {
      // Error de conexión a base de datos
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: "Problema de conexión. Intenta nuevamente en unos momentos" },
          { status: 503 }
        )
      }
    }
    
    // Error genérico pero más amigable
    return NextResponse.json(
      { error: "No se pudieron cargar los pagos. Por favor intenta nuevamente" },
      { status: 500 }
    )
  }
}
