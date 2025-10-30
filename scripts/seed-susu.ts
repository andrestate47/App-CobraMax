
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de SUSU...')

  // Crear usuarios participantes
  const password = await bcrypt.hash('password123', 10)
  
  const participantes = [
    { firstName: 'María', lastName: 'González', email: 'maria.gonzalez@example.com', phone: '987654321' },
    { firstName: 'Juan', lastName: 'Rodríguez', email: 'juan.rodriguez@example.com', phone: '987654322' },
    { firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@example.com', phone: '987654323' },
    { firstName: 'Carlos', lastName: 'López', email: 'carlos.lopez@example.com', phone: '987654324' },
    { firstName: 'Rosa', lastName: 'Hernández', email: 'rosa.hernandez@example.com', phone: '987654325' },
    { firstName: 'Pedro', lastName: 'García', email: 'pedro.garcia@example.com', phone: '987654326' },
    { firstName: 'Isabel', lastName: 'Sánchez', email: 'isabel.sanchez@example.com', phone: '987654327' },
    { firstName: 'Miguel', lastName: 'Ramírez', email: 'miguel.ramirez@example.com', phone: '987654328' },
    { firstName: 'Carmen', lastName: 'Torres', email: 'carmen.torres@example.com', phone: '987654329' },
    { firstName: 'Luis', lastName: 'Flores', email: 'luis.flores@example.com', phone: '987654330' }
  ]

  const usuariosCreados = []
  
  for (const p of participantes) {
    const usuario = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        password,
        firstName: p.firstName,
        lastName: p.lastName,
        name: `${p.firstName} ${p.lastName}`,
        phone: p.phone,
        role: 'COBRADOR',
        isActive: true
      }
    })
    usuariosCreados.push(usuario)
    console.log(`✅ Usuario creado: ${usuario.name}`)
  }

  // Obtener el administrador para ser el creador
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMINISTRADOR' }
  })

  if (!admin) {
    console.error('❌ No se encontró un administrador. Por favor, ejecuta el seed principal primero.')
    return
  }

  // SUSU 1: Grupo de Amigos - Semanal
  console.log('\n📦 Creando SUSU: Grupo de Amigos...')
  const susu1 = await prisma.susu.create({
    data: {
      nombre: 'Grupo de Amigos',
      descripcion: 'SUSU semanal para apoyarnos entre amigos',
      montoTotal: new Decimal(5000),
      frecuencia: 'SEMANAL',
      fechaInicio: new Date('2025-10-01'),
      estado: 'ACTIVO',
      creadorId: admin.id,
      observaciones: 'Reuniones todos los lunes',
      participantes: {
        create: [
          {
            userId: usuariosCreados[0].id,
            orden: 1,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[1].id,
            orden: 2,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[2].id,
            orden: 3,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[3].id,
            orden: 4,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[4].id,
            orden: 5,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          }
        ]
      }
    },
    include: {
      participantes: true
    }
  })
  console.log(`✅ SUSU creado: ${susu1.nombre} con ${susu1.participantes.length} participantes`)

  // Agregar pagos para el primer período
  for (const participante of susu1.participantes) {
    await prisma.susuPago.create({
      data: {
        susuId: susu1.id,
        participanteId: participante.id,
        numeroPeriodo: 1,
        monto: new Decimal(500),
        fechaPago: new Date('2025-10-01'),
        metodoPago: 'SALDO',
        estado: 'COMPLETADO',
        observaciones: 'Primer pago del ciclo'
      }
    })
  }
  console.log(`✅ Pagos del período 1 registrados para ${susu1.nombre}`)

  // SUSU 2: Vecinos Unidos - Quincenal
  console.log('\n📦 Creando SUSU: Vecinos Unidos...')
  const susu2 = await prisma.susu.create({
    data: {
      nombre: 'Vecinos Unidos',
      descripcion: 'SUSU quincenal del barrio',
      montoTotal: new Decimal(8000),
      frecuencia: 'QUINCENAL',
      fechaInicio: new Date('2025-09-15'),
      estado: 'ACTIVO',
      creadorId: admin.id,
      observaciones: 'Pagos cada 1 y 15 del mes',
      participantes: {
        create: [
          {
            userId: usuariosCreados[5].id,
            orden: 1,
            montoPorPeriodo: new Decimal(1000),
            estado: 'ACTIVO',
            yaRecibio: true,
            fechaRecepcion: new Date('2025-09-15')
          },
          {
            userId: usuariosCreados[6].id,
            orden: 2,
            montoPorPeriodo: new Decimal(1000),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[7].id,
            orden: 3,
            montoPorPeriodo: new Decimal(1000),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[8].id,
            orden: 4,
            montoPorPeriodo: new Decimal(1000),
            estado: 'ACTIVO'
          }
        ]
      }
    },
    include: {
      participantes: true
    }
  })
  console.log(`✅ SUSU creado: ${susu2.nombre} con ${susu2.participantes.length} participantes`)

  // Agregar pagos para períodos 1 y 2
  for (let periodo = 1; periodo <= 2; periodo++) {
    for (const participante of susu2.participantes) {
      await prisma.susuPago.create({
        data: {
          susuId: susu2.id,
          participanteId: participante.id,
          numeroPeriodo: periodo,
          monto: new Decimal(1000),
          fechaPago: new Date(periodo === 1 ? '2025-09-15' : '2025-09-30'),
          metodoPago: periodo === 1 ? 'SALDO' : 'TRANSFERENCIA',
          estado: 'COMPLETADO',
          observaciones: `Pago del período ${periodo}`
        }
      })
    }
  }
  console.log(`✅ Pagos de 2 períodos registrados para ${susu2.nombre}`)

  // SUSU 3: Compañeros de Trabajo - Mensual
  console.log('\n📦 Creando SUSU: Compañeros de Trabajo...')
  const susu3 = await prisma.susu.create({
    data: {
      nombre: 'Compañeros de Trabajo',
      descripcion: 'SUSU mensual de la oficina',
      montoTotal: new Decimal(18000),
      frecuencia: 'MENSUAL',
      fechaInicio: new Date('2025-09-01'),
      estado: 'ACTIVO',
      creadorId: admin.id,
      observaciones: 'Pago el primer día hábil de cada mes',
      participantes: {
        create: [
          {
            userId: usuariosCreados[0].id,
            orden: 1,
            montoPorPeriodo: new Decimal(3000),
            estado: 'ACTIVO',
            yaRecibio: true,
            fechaRecepcion: new Date('2025-09-01')
          },
          {
            userId: usuariosCreados[3].id,
            orden: 2,
            montoPorPeriodo: new Decimal(3000),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[5].id,
            orden: 3,
            montoPorPeriodo: new Decimal(3000),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[8].id,
            orden: 4,
            montoPorPeriodo: new Decimal(3000),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[9].id,
            orden: 5,
            montoPorPeriodo: new Decimal(3000),
            estado: 'ACTIVO'
          },
          {
            userId: admin.id,
            orden: 6,
            montoPorPeriodo: new Decimal(3000),
            estado: 'ACTIVO'
          }
        ]
      }
    },
    include: {
      participantes: true
    }
  })
  console.log(`✅ SUSU creado: ${susu3.nombre} con ${susu3.participantes.length} participantes`)

  // Agregar pagos del primer período
  for (const participante of susu3.participantes) {
    await prisma.susuPago.create({
      data: {
        susuId: susu3.id,
        participanteId: participante.id,
        numeroPeriodo: 1,
        monto: new Decimal(3000),
        fechaPago: new Date('2025-09-01'),
        metodoPago: 'DEPOSITO',
        estado: 'COMPLETADO',
        observaciones: 'Primer mes'
      }
    })
  }
  console.log(`✅ Pagos del período 1 registrados para ${susu3.nombre}`)

  // SUSU 4: Familia Extendida - Semanal (con algunos pagos pendientes)
  console.log('\n📦 Creando SUSU: Familia Extendida...')
  const susu4 = await prisma.susu.create({
    data: {
      nombre: 'Familia Extendida',
      descripcion: 'SUSU familiar para emergencias',
      montoTotal: new Decimal(3500),
      frecuencia: 'SEMANAL',
      fechaInicio: new Date('2025-09-20'),
      estado: 'ACTIVO',
      creadorId: admin.id,
      observaciones: 'Reuniones familiares los sábados',
      participantes: {
        create: [
          {
            userId: usuariosCreados[1].id,
            orden: 1,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[4].id,
            orden: 2,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[6].id,
            orden: 3,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[7].id,
            orden: 4,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          },
          {
            userId: usuariosCreados[9].id,
            orden: 5,
            montoPorPeriodo: new Decimal(500),
            estado: 'ACTIVO'
          }
        ]
      }
    },
    include: {
      participantes: true
    }
  })
  console.log(`✅ SUSU creado: ${susu4.nombre} con ${susu4.participantes.length} participantes`)

  // Agregar pagos mixtos (algunos completos, algunos pendientes)
  for (let i = 0; i < susu4.participantes.length; i++) {
    const participante = susu4.participantes[i]
    await prisma.susuPago.create({
      data: {
        susuId: susu4.id,
        participanteId: participante.id,
        numeroPeriodo: 1,
        monto: new Decimal(500),
        fechaPago: new Date('2025-09-20'),
        metodoPago: 'SALDO',
        estado: i < 3 ? 'COMPLETADO' : 'PENDIENTE',
        observaciones: i < 3 ? 'Pagado a tiempo' : 'Pendiente de pago'
      }
    })
  }
  console.log(`✅ Pagos mixtos registrados para ${susu4.nombre}`)

  console.log('\n✨ Seed de SUSU completado exitosamente!')
  console.log(`📊 Resumen:`)
  console.log(`   - ${usuariosCreados.length} usuarios participantes creados`)
  console.log(`   - 4 grupos SUSU creados`)
  console.log(`   - Pagos de ejemplo registrados`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
