
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const clientes = await prisma.cliente.findMany({
      where: {
        activo: true
      },
      orderBy: [
        { codigoCliente: "asc" },
        { nombre: "asc" }
      ]
    })

    return NextResponse.json(clientes.map(cliente => ({
      id: cliente.id,
      codigoCliente: cliente.codigoCliente,
      documento: cliente.documento,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      direccionCliente: cliente.direccionCliente,
      direccionCobro: cliente.direccionCobro,
      telefono: cliente.telefono,
      referenciasPersonales: cliente.referenciasPersonales,
      pais: cliente.pais,
      ciudad: cliente.ciudad,
      foto: cliente.foto,
      fotoDocumento: cliente.fotoDocumento,
      activo: cliente.activo
    })))
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/clientes - Iniciando creación de cliente")
    
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("Error: No hay sesión válida")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("Sesión válida:", session.user?.email)

    const body = await request.json()
    console.log("Datos recibidos:", body)
    
    const { codigoCliente, documento, nombre, apellido, direccionCliente, direccionCobro, telefono, referenciasPersonales, pais, ciudad } = body

    // Validar que tenemos los datos básicos
    if (!documento || !nombre || !apellido) {
      console.log("Error: Campos obligatorios faltantes")
      return NextResponse.json(
        { error: "Los campos documento, nombre y apellido son obligatorios" },
        { status: 400 }
      )
    }

    // Sanitizar datos
    const documentoLimpio = String(documento).trim()
    const nombreLimpio = String(nombre).trim()
    const apellidoLimpio = String(apellido).trim()
    const direccionClienteLimpia = direccionCliente ? String(direccionCliente).trim() : ""
    const direccionCobroLimpia = direccionCobro ? String(direccionCobro).trim() : null
    const telefonoLimpio = telefono ? String(telefono).trim() : null
    const referenciasLimpias = referenciasPersonales ? String(referenciasPersonales).trim() : null
    const paisLimpio = pais ? String(pais).trim() : null
    const ciudadLimpia = ciudad ? String(ciudad).trim() : null

    console.log("Datos sanitizados:", {
      documento: documentoLimpio,
      nombre: nombreLimpio, 
      apellido: apellidoLimpio,
      direccionCliente: direccionClienteLimpia
    })

    // Verificar si ya existe un cliente con el mismo documento
    try {
      const clienteExistentePorDocumento = await prisma.cliente.findUnique({
        where: { documento: documentoLimpio }
      })

      if (clienteExistentePorDocumento) {
        console.log("Error: Cliente ya existe con documento:", documentoLimpio)
        return NextResponse.json(
          { error: "Ya existe un cliente con este documento" },
          { status: 400 }
        )
      }
    } catch (dbError) {
      console.error("Error al verificar cliente existente:", dbError)
      throw new Error("Error al verificar cliente existente")
    }

    // Generar código automáticamente si no se proporciona
    let codigoFinal = codigoCliente
    if (!codigoFinal) {
      try {
        const ultimoCliente = await prisma.cliente.findFirst({
          orderBy: { createdAt: "desc" }
        })
        const ultimoNumero = ultimoCliente ? 
          (parseInt(ultimoCliente.codigoCliente.replace(/^CL/, '')) || 0) : 0
        codigoFinal = `CL${String(ultimoNumero + 1).padStart(3, '0')}`
        console.log("Código generado:", codigoFinal)
      } catch (dbError) {
        console.error("Error al generar código:", dbError)
        // Usar un código por defecto si falla la generación
        codigoFinal = `CL${Date.now()}`
      }
    }

    // Verificar si ya existe un cliente con el mismo código
    if (codigoFinal) {
      try {
        const clienteExistentePorCodigo = await prisma.cliente.findUnique({
          where: { codigoCliente: codigoFinal }
        })

        if (clienteExistentePorCodigo) {
          console.log("Error: Cliente ya existe con código:", codigoFinal)
          return NextResponse.json(
            { error: "Ya existe un cliente con este código" },
            { status: 400 }
          )
        }
      } catch (dbError) {
        console.error("Error al verificar código existente:", dbError)
        throw new Error("Error al verificar código existente")
      }
    }

    console.log("Creando cliente en base de datos...")
    
    const nuevoCliente = await prisma.cliente.create({
      data: {
        codigoCliente: codigoFinal,
        documento: documentoLimpio,
        nombre: nombreLimpio,
        apellido: apellidoLimpio,
        direccionCliente: direccionClienteLimpia || "Sin dirección",
        direccionCobro: direccionCobroLimpia,
        telefono: telefonoLimpio,
        referenciasPersonales: referenciasLimpias,
        pais: paisLimpio,
        ciudad: ciudadLimpia,
        activo: true
      }
    })

    console.log("Cliente creado exitosamente:", nuevoCliente.id)

    return NextResponse.json({
      id: nuevoCliente.id,
      codigoCliente: nuevoCliente.codigoCliente,
      documento: nuevoCliente.documento,
      nombre: nuevoCliente.nombre,
      apellido: nuevoCliente.apellido,
      direccionCliente: nuevoCliente.direccionCliente,
      direccionCobro: nuevoCliente.direccionCobro,
      telefono: nuevoCliente.telefono,
      referenciasPersonales: nuevoCliente.referenciasPersonales,
      pais: nuevoCliente.pais,
      ciudad: nuevoCliente.ciudad,
      foto: nuevoCliente.foto,
      fotoDocumento: nuevoCliente.fotoDocumento,
      activo: nuevoCliente.activo
    })
  } catch (error) {
    console.error("Error detallado al crear cliente:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace')
    
    // Error de violación de constraint único de Prisma
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const target = 'meta' in error && error.meta && typeof error.meta === 'object' && 'target' in error.meta ? error.meta.target : 'campo'
      return NextResponse.json({ 
        error: `Ya existe un cliente con este ${target}` 
      }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, codigoCliente, documento, nombre, apellido, direccionCliente, direccionCobro, telefono, referenciasPersonales, pais, ciudad } = body

    // Validar campos obligatorios
    if (!id || !documento || !nombre || !apellido || !direccionCliente) {
      return NextResponse.json(
        { error: "Los campos ID, documento, nombre, apellido y dirección cliente son obligatorios" },
        { status: 400 }
      )
    }

    // Verificar si el cliente existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id }
    })

    if (!clienteExistente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si ya existe otro cliente con el mismo documento
    const clienteConMismoDocumento = await prisma.cliente.findUnique({
      where: { documento }
    })

    if (clienteConMismoDocumento && clienteConMismoDocumento.id !== id) {
      return NextResponse.json(
        { error: "Ya existe otro cliente con este documento" },
        { status: 400 }
      )
    }

    // Verificar si ya existe otro cliente con el mismo código (si se cambió)
    if (codigoCliente && codigoCliente !== clienteExistente.codigoCliente) {
      const clienteConMismoCodigo = await prisma.cliente.findUnique({
        where: { codigoCliente }
      })

      if (clienteConMismoCodigo && clienteConMismoCodigo.id !== id) {
        return NextResponse.json(
          { error: "Ya existe otro cliente con este código" },
          { status: 400 }
        )
      }
    }

    // Actualizar el cliente
    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: {
        codigoCliente: codigoCliente?.trim() || clienteExistente.codigoCliente,
        documento: documento.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        direccionCliente: direccionCliente.trim(),
        direccionCobro: direccionCobro?.trim() || null,
        telefono: telefono?.trim() || null,
        referenciasPersonales: referenciasPersonales?.trim() || null,
        pais: pais?.trim() || null,
        ciudad: ciudad?.trim() || null
      }
    })

    return NextResponse.json({
      id: clienteActualizado.id,
      codigoCliente: clienteActualizado.codigoCliente,
      documento: clienteActualizado.documento,
      nombre: clienteActualizado.nombre,
      apellido: clienteActualizado.apellido,
      direccionCliente: clienteActualizado.direccionCliente,
      direccionCobro: clienteActualizado.direccionCobro,
      telefono: clienteActualizado.telefono,
      referenciasPersonales: clienteActualizado.referenciasPersonales,
      pais: clienteActualizado.pais,
      ciudad: clienteActualizado.ciudad,
      foto: clienteActualizado.foto,
      fotoDocumento: clienteActualizado.fotoDocumento,
      activo: clienteActualizado.activo
    })
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
