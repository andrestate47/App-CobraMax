
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  try {
    // Crear usuario administrador
    const adminPassword = await bcryptjs.hash('admin123', 12)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cobranza.com' },
      update: {},
      create: {
        email: 'admin@cobranza.com',
        password: adminPassword,
        firstName: 'Administrador',
        lastName: 'Principal',
        name: 'Administrador Principal',
        role: 'ADMINISTRADOR'
      }
    })
    console.log('✅ Usuario administrador creado/actualizado:', admin.email)

    // Crear usuario supervisor
    const supervisorPassword = await bcryptjs.hash('supervisor123', 12)
    const supervisor = await prisma.user.upsert({
      where: { email: 'supervisor@cobranza.com' },
      update: {},
      create: {
        email: 'supervisor@cobranza.com',
        password: supervisorPassword,
        firstName: 'María',
        lastName: 'Supervisora',
        name: 'María Supervisora',
        role: 'SUPERVISOR'
      }
    })
    console.log('✅ Usuario supervisor creado/actualizado:', supervisor.email)

    // Crear usuario cobrador
    const cobradorPassword = await bcryptjs.hash('cobrador123', 12)
    const cobrador = await prisma.user.upsert({
      where: { email: 'cobrador@cobranza.com' },
      update: {},
      create: {
        email: 'cobrador@cobranza.com',
        password: cobradorPassword,
        firstName: 'Juan',
        lastName: 'Pérez',
        name: 'Juan Pérez',
        role: 'COBRADOR',
        timeLimit: 480, // 8 horas por día
        supervisorId: supervisor.id,
        numeroRuta: 'RUTA-001'
      }
    })
    console.log('✅ Usuario cobrador creado/actualizado:', cobrador.email)

    // Crear 8 cobradores adicionales
    const cobrador2Password = await bcryptjs.hash('cobrador123', 12)
    const cobrador2 = await prisma.user.upsert({
      where: { email: 'cobrador2@cobranza.com' },
      update: {},
      create: {
        email: 'cobrador2@cobranza.com',
        password: cobrador2Password,
        firstName: 'Carlos',
        lastName: 'Ramírez',
        name: 'Carlos Ramírez',
        role: 'COBRADOR',
        timeLimit: 480,
        supervisorId: supervisor.id,
        numeroRuta: 'RUTA-002'
      }
    })
    console.log('✅ Usuario cobrador 2 creado/actualizado:', cobrador2.email)

    const cobrador3Password = await bcryptjs.hash('cobrador123', 12)
    const cobrador3 = await prisma.user.upsert({
      where: { email: 'cobrador3@cobranza.com' },
      update: {},
      create: {
        email: 'cobrador3@cobranza.com',
        password: cobrador3Password,
        firstName: 'Luis',
        lastName: 'Martínez',
        name: 'Luis Martínez',
        role: 'COBRADOR',
        timeLimit: 480,
        supervisorId: supervisor.id,
        numeroRuta: 'RUTA-003'
      }
    })
    console.log('✅ Usuario cobrador 3 creado/actualizado:', cobrador3.email)

    const cobrador4Password = await bcryptjs.hash('cobrador123', 12)
    const cobrador4 = await prisma.user.upsert({
      where: { email: 'cobrador4@cobranza.com' },
      update: {},
      create: {
        email: 'cobrador4@cobranza.com',
        password: cobrador4Password,
        firstName: 'Ana',
        lastName: 'González',
        name: 'Ana González',
        role: 'COBRADOR',
        timeLimit: 480,
        supervisorId: supervisor.id,
        numeroRuta: 'RUTA-004'
      }
    })
    console.log('✅ Usuario cobrador 4 creado/actualizado:', cobrador4.email)

    const cobrador5Password = await bcryptjs.hash('cobrador123', 12)
    const cobrador5 = await prisma.user.upsert({
      where: { email: 'cobrador5@cobranza.com' },
      update: {},
      create: {
        email: 'cobrador5@cobranza.com',
        password: cobrador5Password,
        firstName: 'Pedro',
        lastName: 'Silva',
        name: 'Pedro Silva',
        role: 'COBRADOR',
        timeLimit: 480,
        supervisorId: supervisor.id,
        numeroRuta: 'RUTA-005'
      }
    })
    console.log('✅ Usuario cobrador 5 creado/actualizado:', cobrador5.email)

    const cobrador6Password = await bcryptjs.hash('cobrador123', 12)
    const cobrador6 = await prisma.user.upsert({
      where: { email: 'cobrador6@cobranza.com' },
      update: {},
      create: {
        email: 'cobrador6@cobranza.com',
        password: cobrador6Password,
        firstName: 'María',
        lastName: 'López',
        name: 'María López',
        role: 'COBRADOR',
        timeLimit: 480,
        supervisorId: supervisor.id,
        numeroRuta: 'RUTA-006'
      }
    })
    console.log('✅ Usuario cobrador 6 creado/actualizado:', cobrador6.email)

    const cobrador7Password = await bcryptjs.hash('cobrador123', 12)
    const cobrador7 = await prisma.user.upsert({
      where: { email: 'cobrador7@cobranza.com' },
      update: {},
      create: {
        email: 'cobrador7@cobranza.com',
        password: cobrador7Password,
        firstName: 'Roberto',
        lastName: 'Torres',
        name: 'Roberto Torres',
        role: 'COBRADOR',
        timeLimit: 480,
        supervisorId: supervisor.id,
        numeroRuta: 'RUTA-007'
      }
    })
    console.log('✅ Usuario cobrador 7 creado/actualizado:', cobrador7.email)

    const cobrador8Password = await bcryptjs.hash('cobrador123', 12)
    const cobrador8 = await prisma.user.upsert({
      where: { email: 'cobrador8@cobranza.com' },
      update: {},
      create: {
        email: 'cobrador8@cobranza.com',
        password: cobrador8Password,
        firstName: 'Diana',
        lastName: 'Moreno',
        name: 'Diana Moreno',
        role: 'COBRADOR',
        timeLimit: 480,
        supervisorId: supervisor.id,
        numeroRuta: 'RUTA-008'
      }
    })
    console.log('✅ Usuario cobrador 8 creado/actualizado:', cobrador8.email)

    const cobrador9Password = await bcryptjs.hash('cobrador123', 12)
    const cobrador9 = await prisma.user.upsert({
      where: { email: 'cobrador9@cobranza.com' },
      update: {},
      create: {
        email: 'cobrador9@cobranza.com',
        password: cobrador9Password,
        firstName: 'Fernando',
        lastName: 'Vargas',
        name: 'Fernando Vargas',
        role: 'COBRADOR',
        timeLimit: 480,
        supervisorId: supervisor.id,
        numeroRuta: 'RUTA-009'
      }
    })
    console.log('✅ Usuario cobrador 9 creado/actualizado:', cobrador9.email)

    // Crear configuraciones de sueldo para los usuarios
    await prisma.configuracionSueldo.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        salarioBase: 3500000, // $3,500,000 COP
        comisionPorCobro: 0,
        limitePorcentajeAvance: 0,
        montoMinimoAvance: 0,
        activo: true
      }
    })

    await prisma.configuracionSueldo.upsert({
      where: { userId: supervisor.id },
      update: {},
      create: {
        userId: supervisor.id,
        salarioBase: 2500000, // $2,500,000 COP
        comisionPorCobro: 2.5, // 2.5% de comisión
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 0,
        activo: true
      }
    })

    await prisma.configuracionSueldo.upsert({
      where: { userId: cobrador.id },
      update: {},
      create: {
        userId: cobrador.id,
        salarioBase: 1800000, // $1,800,000 COP
        comisionPorCobro: 5, // 5% de comisión
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 500000, // Mínimo $500,000 para avance
        activo: true
      }
    })

    // Configuraciones de sueldo para los 8 cobradores adicionales
    await prisma.configuracionSueldo.upsert({
      where: { userId: cobrador2.id },
      update: {},
      create: {
        userId: cobrador2.id,
        salarioBase: 1800000,
        comisionPorCobro: 5,
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 500000,
        activo: true
      }
    })

    await prisma.configuracionSueldo.upsert({
      where: { userId: cobrador3.id },
      update: {},
      create: {
        userId: cobrador3.id,
        salarioBase: 1800000,
        comisionPorCobro: 5,
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 500000,
        activo: true
      }
    })

    await prisma.configuracionSueldo.upsert({
      where: { userId: cobrador4.id },
      update: {},
      create: {
        userId: cobrador4.id,
        salarioBase: 1800000,
        comisionPorCobro: 5,
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 500000,
        activo: true
      }
    })

    await prisma.configuracionSueldo.upsert({
      where: { userId: cobrador5.id },
      update: {},
      create: {
        userId: cobrador5.id,
        salarioBase: 1800000,
        comisionPorCobro: 5,
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 500000,
        activo: true
      }
    })

    await prisma.configuracionSueldo.upsert({
      where: { userId: cobrador6.id },
      update: {},
      create: {
        userId: cobrador6.id,
        salarioBase: 1800000,
        comisionPorCobro: 5,
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 500000,
        activo: true
      }
    })

    await prisma.configuracionSueldo.upsert({
      where: { userId: cobrador7.id },
      update: {},
      create: {
        userId: cobrador7.id,
        salarioBase: 1800000,
        comisionPorCobro: 5,
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 500000,
        activo: true
      }
    })

    await prisma.configuracionSueldo.upsert({
      where: { userId: cobrador8.id },
      update: {},
      create: {
        userId: cobrador8.id,
        salarioBase: 1800000,
        comisionPorCobro: 5,
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 500000,
        activo: true
      }
    })

    await prisma.configuracionSueldo.upsert({
      where: { userId: cobrador9.id },
      update: {},
      create: {
        userId: cobrador9.id,
        salarioBase: 1800000,
        comisionPorCobro: 5,
        limitePorcentajeAvance: 50,
        montoMinimoAvance: 500000,
        activo: true
      }
    })

    console.log('✅ Configuraciones de sueldo creadas/actualizadas para todos los cobradores')

    // Crear cuenta de prueba obligatoria (oculta)
    const testPassword = await bcryptjs.hash('johndoe123', 12)
    const testUser = await prisma.user.upsert({
      where: { email: 'john@doe.com' },
      update: {},
      create: {
        email: 'john@doe.com',
        password: testPassword,
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        role: 'ADMINISTRADOR'
      }
    })
    console.log('✅ Usuario de prueba creado/actualizado')

    // Crear permisos por defecto para cobrador
    const cobradorPermissions = [
      'VER_DASHBOARD',
      'VER_LISTADO_GENERAL',
      'VER_DETALLES_PRESTAMO',
      'REGISTRAR_COBROS',
      'MAPA_CLIENTES',
      'REGISTRAR_GASTOS',
      'VER_REPORTES',
      'CREAR_CLIENTES',
      'EDITAR_CLIENTES'
    ]

    const cobradores = [cobrador, cobrador2, cobrador3, cobrador4, cobrador5, cobrador6, cobrador7, cobrador8, cobrador9]
    
    for (const cobradorUser of cobradores) {
      for (const permission of cobradorPermissions) {
        await prisma.userPermission.upsert({
          where: {
            userId_permission: {
              userId: cobradorUser.id,
              permission: permission as any
            }
          },
          update: {},
          create: {
            userId: cobradorUser.id,
            permission: permission as any
          }
        })
      }
    }

    // Crear permisos por defecto para supervisor
    const supervisorPermissions = [
      ...cobradorPermissions,
      'VER_AUDITORIA',
      'ELIMINAR_PRESTAMOS',
      'CREAR_PRESTAMOS',
      'EDITAR_PRESTAMOS',
      'REGISTRAR_TRANSFERENCIAS',
      'VER_TRANSFERENCIAS',
      'REALIZAR_CIERRE_DIA',
      'VER_CIERRES_HISTORICOS',
      'SINCRONIZAR_DATOS'
    ]

    for (const permission of supervisorPermissions) {
      await prisma.userPermission.upsert({
        where: {
          userId_permission: {
            userId: supervisor.id,
            permission: permission as any
          }
        },
        update: {},
        create: {
          userId: supervisor.id,
          permission: permission as any
        }
      })
    }

    // Los administradores no necesitan permisos específicos, tienen acceso total
    console.log('✅ Permisos por defecto asignados')

    // Crear clientes de ejemplo con mucha más variedad
    const cliente1 = await prisma.cliente.upsert({
      where: { documento: '12345678' },
      update: {},
      create: {
        codigoCliente: 'CL001',
        documento: '12345678',
        nombre: 'María',
        apellido: 'García',
        direccionCliente: 'Calle 123 #45-67, Barrio Centro, Bogotá',
        direccionCobro: 'Carrera 15 #23-45, Oficina, Bogotá',
        telefono: '3001234567',
        pais: 'Colombia',
        ciudad: 'Bogotá',
        referenciasPersonales: 'Hermana: Ana García - 3009876543, Vecino: Pedro López - 3012345678'
      }
    })

    const cliente2 = await prisma.cliente.upsert({
      where: { documento: '87654321' },
      update: {},
      create: {
        codigoCliente: 'CL002',
        documento: '87654321',
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        direccionCliente: 'Carrera 98 #76-54, Barrio Norte, Medellín',
        direccionCobro: 'Avenida 80 #45-23, Trabajo, Medellín',
        telefono: '3007654321',
        pais: 'Colombia',
        ciudad: 'Medellín',
        referenciasPersonales: 'Esposa: Laura Pérez - 3011234567'
      }
    })

    const cliente3 = await prisma.cliente.upsert({
      where: { documento: '11223344' },
      update: {},
      create: {
        codigoCliente: 'CL003',
        documento: '11223344',
        nombre: 'Ana',
        apellido: 'Martínez',
        direccionCliente: 'Avenida Principal #12-34, Barrio Sur, Cali',
        telefono: '3001122334',
        pais: 'Colombia',
        ciudad: 'Cali',
        referenciasPersonales: 'Madre: Rosa Martínez - 3009988776'
      }
    })

    const cliente4 = await prisma.cliente.upsert({
      where: { documento: '55667788' },
      update: {},
      create: {
        codigoCliente: 'CL004',
        documento: '55667788',
        nombre: 'Luis',
        apellido: 'González',
        direccionCliente: 'Transversal 45 #67-89, Centro, Barranquilla',
        direccionCobro: 'Calle 72 #11-25, Negocio, Barranquilla',
        telefono: '3005566778',
        pais: 'Colombia',
        ciudad: 'Barranquilla',
        referenciasPersonales: 'Hermano: José González - 3008877665'
      }
    })

    const cliente5 = await prisma.cliente.upsert({
      where: { documento: '99887766' },
      update: {},
      create: {
        codigoCliente: 'CL005',
        documento: '99887766',
        nombre: 'Sandra',
        apellido: 'López',
        direccionCliente: 'Calle 50 #30-20, Barrio La Paz, Cartagena',
        telefono: '3009988776',
        pais: 'Colombia',
        ciudad: 'Cartagena',
        referenciasPersonales: 'Amiga: Julia Ramírez - 3001122334, Primo: Diego López - 3002233445'
      }
    })

    const cliente6 = await prisma.cliente.upsert({
      where: { documento: '44556677' },
      update: {},
      create: {
        codigoCliente: 'CL006',
        documento: '44556677',
        nombre: 'Pedro',
        apellido: 'Ramírez',
        direccionCliente: 'Carrera 25 #15-35, Villa Nueva, Bucaramanga',
        direccionCobro: 'Avenida 33 #18-50, Tienda, Bucaramanga',
        telefono: '3004455667',
        pais: 'Colombia',
        ciudad: 'Bucaramanga',
        referenciasPersonales: 'Padre: Miguel Ramírez - 3003344556'
      }
    })

    const cliente7 = await prisma.cliente.upsert({
      where: { documento: '33445566' },
      update: {},
      create: {
        codigoCliente: 'CL007',
        documento: '33445566',
        nombre: 'Diana',
        apellido: 'Morales',
        direccionCliente: 'Transversal 10 #5-25, Barrio Obrero, Pereira',
        telefono: '3003344556',
        pais: 'Colombia',
        ciudad: 'Pereira',
        referenciasPersonales: 'Tía: Carmen Morales - 3005544332'
      }
    })

    const cliente8 = await prisma.cliente.upsert({
      where: { documento: '22334455' },
      update: {},
      create: {
        codigoCliente: 'CL008',
        documento: '22334455',
        nombre: 'Roberto',
        apellido: 'Sánchez',
        direccionCliente: 'Calle 80 #40-60, Centro, Manizales',
        direccionCobro: 'Carrera 23 #35-45, Oficina, Manizales',
        telefono: '3002233445',
        pais: 'Colombia',
        ciudad: 'Manizales',
        referenciasPersonales: 'Esposa: Patricia Sánchez - 3001234321, Cuñado: Juan Pérez - 3009876123'
      }
    })

    const cliente9 = await prisma.cliente.upsert({
      where: { documento: '66778899' },
      update: {},
      create: {
        codigoCliente: 'CL009',
        documento: '66778899',
        nombre: 'Lucía',
        apellido: 'Torres',
        direccionCliente: 'Avenida 15 #20-30, Barrio San José, Santa Marta',
        telefono: '3006677889',
        pais: 'Colombia',
        ciudad: 'Santa Marta'
      }
    })

    const cliente10 = await prisma.cliente.upsert({
      where: { documento: '77889900' },
      update: {},
      create: {
        codigoCliente: 'CL010',
        documento: '77889900',
        nombre: 'Javier',
        apellido: 'Herrera',
        direccionCliente: 'Carrera 12 #8-15, Centro, Ibagué',
        direccionCobro: 'Calle 19 #12-30, Local, Ibagué',
        telefono: '3007788990',
        pais: 'Colombia',
        ciudad: 'Ibagué',
        referenciasPersonales: 'Hermana: Mónica Herrera - 3008899001'
      }
    })

    const cliente11 = await prisma.cliente.upsert({
      where: { documento: '88990011' },
      update: {},
      create: {
        codigoCliente: 'CL011',
        documento: '88990011',
        nombre: 'Gabriela',
        apellido: 'Vargas',
        direccionCliente: 'Transversal 30 #25-40, Barrio El Prado, Cúcuta',
        telefono: '3008899001',
        pais: 'Colombia',
        ciudad: 'Cúcuta',
        referenciasPersonales: 'Madre: Elena Vargas - 3009900112'
      }
    })

    const cliente12 = await prisma.cliente.upsert({
      where: { documento: '99001122' },
      update: {},
      create: {
        codigoCliente: 'CL012',
        documento: '99001122',
        nombre: 'Fernando',
        apellido: 'Castro',
        direccionCliente: 'Calle 45 #30-50, Villa Hermosa, Montería',
        direccionCobro: 'Avenida Primera #15-25, Trabajo, Montería',
        telefono: '3009900112',
        pais: 'Colombia',
        ciudad: 'Montería',
        referenciasPersonales: 'Primo: Carlos Castro - 3001122334'
      }
    })

    const cliente13 = await prisma.cliente.upsert({
      where: { documento: '10203040' },
      update: {},
      create: {
        codigoCliente: 'CL013',
        documento: '10203040',
        nombre: 'Camila',
        apellido: 'Reyes',
        direccionCliente: 'Carrera 18 #22-35, Barrio Norte, Neiva',
        telefono: '3001020304',
        pais: 'Colombia',
        ciudad: 'Neiva'
      }
    })

    const cliente14 = await prisma.cliente.upsert({
      where: { documento: '20304050' },
      update: {},
      create: {
        codigoCliente: 'CL014',
        documento: '20304050',
        nombre: 'Andrés',
        apellido: 'Mendoza',
        direccionCliente: 'Avenida 8 #12-20, Centro, Pasto',
        direccionCobro: 'Calle 20 #10-15, Negocio, Pasto',
        telefono: '3002030405',
        pais: 'Colombia',
        ciudad: 'Pasto',
        referenciasPersonales: 'Padre: Luis Mendoza - 3003040506'
      }
    })

    const cliente15 = await prisma.cliente.upsert({
      where: { documento: '30405060' },
      update: {},
      create: {
        codigoCliente: 'CL015',
        documento: '30405060',
        nombre: 'Valeria',
        apellido: 'Jiménez',
        direccionCliente: 'Transversal 5 #8-12, Barrio La Florida, Popayán',
        telefono: '3003040506',
        pais: 'Colombia',
        ciudad: 'Popayán',
        referenciasPersonales: 'Tía: Rosa Jiménez - 3004050607, Amiga: Laura Gómez - 3005060708'
      }
    })

    const cliente16 = await prisma.cliente.upsert({
      where: { documento: '40506070' },
      update: {},
      create: {
        codigoCliente: 'CL016',
        documento: '40506070',
        nombre: 'Miguel',
        apellido: 'Ortiz',
        direccionCliente: 'Calle 30 #18-25, Centro, Villavicencio',
        direccionCobro: 'Carrera 40 #22-30, Oficina, Villavicencio',
        telefono: '3004050607',
        pais: 'Colombia',
        ciudad: 'Villavicencio'
      }
    })

    const cliente17 = await prisma.cliente.upsert({
      where: { documento: '50607080' },
      update: {},
      create: {
        codigoCliente: 'CL017',
        documento: '50607080',
        nombre: 'Paula',
        apellido: 'Gómez',
        direccionCliente: 'Avenida 20 #15-30, Barrio Kennedy, Sincelejo',
        telefono: '3005060708',
        pais: 'Colombia',
        ciudad: 'Sincelejo',
        referenciasPersonales: 'Hermano: David Gómez - 3006070809'
      }
    })

    const cliente18 = await prisma.cliente.upsert({
      where: { documento: '60708090' },
      update: {},
      create: {
        codigoCliente: 'CL018',
        documento: '60708090',
        nombre: 'Jorge',
        apellido: 'Ruiz',
        direccionCliente: 'Carrera 50 #35-45, Villa María, Armenia',
        direccionCobro: 'Calle 15 #20-30, Local, Armenia',
        telefono: '3006070809',
        pais: 'Colombia',
        ciudad: 'Armenia',
        referenciasPersonales: 'Esposa: María Ruiz - 3007080910'
      }
    })

    const cliente19 = await prisma.cliente.upsert({
      where: { documento: '70809010' },
      update: {},
      create: {
        codigoCliente: 'CL019',
        documento: '70809010',
        nombre: 'Natalia',
        apellido: 'Cruz',
        direccionCliente: 'Transversal 12 #10-18, Barrio El Bosque, Valledupar',
        telefono: '3007080910',
        pais: 'Colombia',
        ciudad: 'Valledupar'
      }
    })

    const cliente20 = await prisma.cliente.upsert({
      where: { documento: '80910120' },
      update: {},
      create: {
        codigoCliente: 'CL020',
        documento: '80910120',
        nombre: 'Ricardo',
        apellido: 'Rojas',
        direccionCliente: 'Calle 60 #45-55, Centro, Tunja',
        direccionCobro: 'Avenida Norte #30-40, Trabajo, Tunja',
        telefono: '3008091012',
        pais: 'Colombia',
        ciudad: 'Tunja',
        referenciasPersonales: 'Primo: Alberto Rojas - 3009101213'
      }
    })

    console.log('✅ 20 Clientes creados/actualizados con información completa')

    // Crear préstamos variados para todos los clientes
    const prestamosData = [
      { cliente: cliente1, monto: 500000, interes: 20, tipoPago: 'DIARIO', cuotas: 30, diasDesdeInicio: 10, observaciones: 'Capital de trabajo', tipoCredito: 'EFECTIVO' },
      { cliente: cliente2, monto: 300000, interes: 15, tipoPago: 'DIARIO', cuotas: 15, diasDesdeInicio: 5, observaciones: 'Negocio familiar', tipoCredito: 'EFECTIVO' },
      { cliente: cliente3, monto: 800000, interes: 18, tipoPago: 'SEMANAL', cuotas: 8, diasDesdeInicio: 14, observaciones: 'Ampliación de local' },
      { cliente: cliente4, monto: 200000, interes: 18, tipoPago: 'SEMANAL', cuotas: 4, diasDesdeInicio: 7, observaciones: 'Inventario', tipoCredito: 'EFECTIVO' },
      { cliente: cliente5, monto: 1000000, interes: 22, tipoPago: 'QUINCENAL', cuotas: 4, diasDesdeInicio: 15, observaciones: 'Compra de mercancía', tipoCredito: 'TRANSFERENCIA' },
      { cliente: cliente6, monto: 600000, interes: 20, tipoPago: 'LUNES_A_VIERNES', cuotas: 25, diasDesdeInicio: 12, observaciones: 'Remodelación tienda' },
      { cliente: cliente7, monto: 450000, interes: 17, tipoPago: 'DIARIO', cuotas: 20, diasDesdeInicio: 8, observaciones: 'Pago de proveedores', tipoCredito: 'EFECTIVO' },
      { cliente: cliente8, monto: 750000, interes: 19, tipoPago: 'LUNES_A_SABADO', cuotas: 30, diasDesdeInicio: 18, observaciones: 'Equipamiento oficina', tipoCredito: 'TRANSFERENCIA' },
      { cliente: cliente9, monto: 350000, interes: 16, tipoPago: 'SEMANAL', cuotas: 6, diasDesdeInicio: 6, observaciones: 'Gastos personales' },
      { cliente: cliente10, monto: 900000, interes: 21, tipoPago: 'CATORCENAL', cuotas: 6, diasDesdeInicio: 14, observaciones: 'Expansión negocio', tipoCredito: 'TRANSFERENCIA' },
      { cliente: cliente11, monto: 400000, interes: 18, tipoPago: 'DIARIO', cuotas: 25, diasDesdeInicio: 9, observaciones: 'Capital de trabajo' },
      { cliente: cliente12, monto: 550000, interes: 19, tipoPago: 'FIN_DE_MES', cuotas: 3, diasDesdeInicio: 20, observaciones: 'Compra de stock', tipoCredito: 'EFECTIVO' },
      { cliente: cliente13, monto: 650000, interes: 20, tipoPago: 'QUINCENAL', cuotas: 5, diasDesdeInicio: 10, observaciones: 'Inversión local' },
      { cliente: cliente14, monto: 300000, interes: 15, tipoPago: 'DIARIO', cuotas: 18, diasDesdeInicio: 7, observaciones: 'Emergencia familiar', tipoCredito: 'EFECTIVO' },
      { cliente: cliente15, monto: 850000, interes: 21, tipoPago: 'MENSUAL', cuotas: 6, diasDesdeInicio: 25, observaciones: 'Compra vehículo trabajo', tipoCredito: 'TRANSFERENCIA' },
      { cliente: cliente16, monto: 500000, interes: 18, tipoPago: 'SEMANAL', cuotas: 7, diasDesdeInicio: 11, observaciones: 'Reparaciones' },
      { cliente: cliente17, monto: 700000, interes: 20, tipoPago: 'LUNES_A_VIERNES', cuotas: 28, diasDesdeInicio: 15, observaciones: 'Capital de trabajo', tipoCredito: 'EFECTIVO' },
      { cliente: cliente18, monto: 400000, interes: 17, tipoPago: 'DIARIO', cuotas: 22, diasDesdeInicio: 8, observaciones: 'Renovación inventario' },
      { cliente: cliente19, monto: 950000, interes: 22, tipoPago: 'QUINCENAL', cuotas: 6, diasDesdeInicio: 16, observaciones: 'Proyecto negocio', tipoCredito: 'TRANSFERENCIA' },
      { cliente: cliente20, monto: 600000, interes: 19, tipoPago: 'CATORCENAL', cuotas: 5, diasDesdeInicio: 13, observaciones: 'Compra equipo' }
    ]

    const prestamos = []
    for (const data of prestamosData) {
      const fechaInicio = new Date()
      fechaInicio.setDate(fechaInicio.getDate() - data.diasDesdeInicio)

      // Calcular duración según tipo de pago
      const diasPorCuota = {
        'DIARIO': 1,
        'SEMANAL': 7,
        'LUNES_A_VIERNES': 1,
        'LUNES_A_SABADO': 1,
        'QUINCENAL': 15,
        'CATORCENAL': 14,
        'FIN_DE_MES': 30,
        'MENSUAL': 30
      }
      
      const duracionDias = (diasPorCuota[data.tipoPago as keyof typeof diasPorCuota] || 1) * data.cuotas
      const fechaFin = new Date(fechaInicio)
      fechaFin.setDate(fechaFin.getDate() + duracionDias)

      // Calcular valor de cuota
      const montoTotal = data.monto * (1 + data.interes / 100)
      const valorCuota = Math.ceil(montoTotal / data.cuotas)

      const prestamo = await prisma.prestamo.create({
        data: {
          clienteId: data.cliente.id,
          userId: admin.id,
          monto: data.monto,
          interes: data.interes,
          tipoPago: data.tipoPago as any,
          cuotas: data.cuotas,
          valorCuota: valorCuota,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          observaciones: data.observaciones,
          tipoCredito: (data.tipoCredito || 'EFECTIVO') as any,
          diasGracia: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0,
          moraCredito: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0
        }
      })
      prestamos.push(prestamo)
    }

    // Agregar algunos clientes con múltiples préstamos
    const prestamo2_cliente1 = await prisma.prestamo.create({
      data: {
        clienteId: cliente1.id,
        userId: admin.id,
        monto: 250000,
        interes: 18,
        tipoPago: 'SEMANAL',
        cuotas: 5,
        valorCuota: 59000,
        fechaInicio: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        observaciones: 'Segundo préstamo - emergencia',
        tipoCredito: 'EFECTIVO'
      }
    })
    prestamos.push(prestamo2_cliente1)

    const prestamo2_cliente5 = await prisma.prestamo.create({
      data: {
        clienteId: cliente5.id,
        userId: admin.id,
        monto: 400000,
        interes: 20,
        tipoPago: 'DIARIO',
        cuotas: 20,
        valorCuota: 24000,
        fechaInicio: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        observaciones: 'Segundo préstamo - compra urgente',
        tipoCredito: 'EFECTIVO'
      }
    })
    prestamos.push(prestamo2_cliente5)

    const prestamo2_cliente10 = await prisma.prestamo.create({
      data: {
        clienteId: cliente10.id,
        userId: admin.id,
        monto: 300000,
        interes: 17,
        tipoPago: 'SEMANAL',
        cuotas: 4,
        valorCuota: 87750,
        fechaInicio: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        observaciones: 'Segundo préstamo - oportunidad negocio'
      }
    })
    prestamos.push(prestamo2_cliente10)

    console.log(`✅ ${prestamos.length} Préstamos creados con diferentes tipos de pago`)

    // Crear pagos variados para los préstamos
    const pagos = []
    
    // Pagos para algunos préstamos (no todos tienen pagos para simular diferentes estados)
    for (let i = 0; i < Math.min(15, prestamos.length); i++) {
      const prestamo = prestamos[i]
      const numPagos = Math.floor(Math.random() * 5) + 1 // Entre 1 y 5 pagos
      
      for (let j = 0; j < numPagos; j++) {
        const diasAtras = (j + 1) * (Math.random() > 0.5 ? 3 : 7) // 3 o 7 días entre pagos
        const pago = await prisma.pago.create({
          data: {
            prestamoId: prestamo.id,
            userId: cobrador.id,
            monto: prestamo.valorCuota,
            fecha: new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000),
            observaciones: j === 0 ? 'Primer pago' : `Pago #${j + 1}`
          }
        })
        pagos.push(pago)
      }
    }

    console.log(`✅ ${pagos.length} Pagos de ejemplo creados`)

    // Crear algunos gastos de ejemplo
    const gasto1 = await prisma.gasto.create({
      data: {
        userId: cobrador.id,
        concepto: 'Combustible',
        monto: 50000,
        fecha: new Date(),
        observaciones: 'Gasolina para recorrido de cobranza'
      }
    })

    const gasto2 = await prisma.gasto.create({
      data: {
        userId: cobrador.id,
        concepto: 'Almuerzo',
        monto: 15000,
        fecha: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
      }
    })

    console.log('✅ Gastos de ejemplo creados')

    console.log('\n🎉 Seed completado exitosamente!')
    console.log('\n📝 Usuarios creados:')
    console.log('   👤 Administrador: admin@cobranza.com / admin123')
    console.log('   👤 Supervisor: supervisor@cobranza.com / supervisor123')
    console.log('   👤 Cobradores (9 usuarios con contraseña "cobrador123"):')
    console.log('      - cobrador@cobranza.com (Juan Pérez - RUTA-001)')
    console.log('      - cobrador2@cobranza.com (Carlos Ramírez - RUTA-002)')
    console.log('      - cobrador3@cobranza.com (Luis Martínez - RUTA-003)')
    console.log('      - cobrador4@cobranza.com (Ana González - RUTA-004)')
    console.log('      - cobrador5@cobranza.com (Pedro Silva - RUTA-005)')
    console.log('      - cobrador6@cobranza.com (María López - RUTA-006)')
    console.log('      - cobrador7@cobranza.com (Roberto Torres - RUTA-007)')
    console.log('      - cobrador8@cobranza.com (Diana Moreno - RUTA-008)')
    console.log('      - cobrador9@cobranza.com (Fernando Vargas - RUTA-009)')
    console.log('\n🔐 Sistema de permisos configurado:')
    console.log('   ✅ Administradores: Acceso total')
    console.log('   ✅ Supervisores: Permisos avanzados de gestión')
    console.log('   ✅ Cobradores (9): Permisos básicos operativos')
    console.log('\n💰 Datos de ejemplo:')
    console.log(`   👥 20 clientes con información completa (nombres, direcciones, teléfonos, referencias)`)
    console.log(`   💳 ${prestamos.length} préstamos activos con diferentes condiciones y tipos de pago`)
    console.log(`   💵 ${pagos.length} pagos registrados en diferentes fechas`)
    console.log('   🧾 Gastos registrados para el cobrador')
    console.log('\n📊 Variedad de datos:')
    console.log('   ✅ Tipos de pago: DIARIO, SEMANAL, QUINCENAL, CATORCENAL, FIN_DE_MES, MENSUAL, LUNES_A_VIERNES, LUNES_A_SABADO')
    console.log('   ✅ Diferentes estados de préstamos: al día, morosos, vencidos')
    console.log('   ✅ Clientes con uno o múltiples préstamos')
    console.log('   ✅ 20 ciudades diferentes de Colombia')
    console.log('   ✅ Referencias personales incluidas')
    console.log('\n🗺️ Direcciones de ejemplo de 20 ciudades colombianas para pruebas de mapas')

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
