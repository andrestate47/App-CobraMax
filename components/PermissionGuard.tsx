

"use client"

import { ReactNode } from "react"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/lib/permissions"

interface PermissionGuardProps {
  children: ReactNode
  permissions?: Permission | Permission[]
  roles?: ("COBRADOR" | "SUPERVISOR" | "ADMINISTRADOR")[]
  requireAll?: boolean // Si es true, requiere TODOS los permisos. Si es false, requiere AL MENOS UNO
  fallback?: ReactNode
  showError?: boolean
}

export default function PermissionGuard({
  children,
  permissions,
  roles,
  requireAll = false,
  fallback = null,
  showError = false
}: PermissionGuardProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions 
  } = usePermissions()

  // Si está cargando, mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada
  if (!isAuthenticated) {
    return showError ? (
      <div className="text-red-600 p-4 text-center">
        <p>Debes iniciar sesión para ver este contenido</p>
      </div>
    ) : null
  }

  // Verificar si el usuario está activo
  if (!user?.isActive) {
    return (
      <div className="text-red-600 p-4 text-center bg-red-50 rounded-lg">
        <p className="font-semibold">Usuario desactivado</p>
        <p className="text-sm">Contacta al administrador para reactivar tu cuenta</p>
      </div>
    )
  }

  // Verificar roles si se especifican
  if (roles && roles.length > 0) {
    if (!roles.includes(user.role)) {
      return fallback || (showError ? (
        <div className="text-amber-600 p-4 text-center bg-amber-50 rounded-lg">
          <p className="font-semibold">Acceso restringido</p>
          <p className="text-sm">No tienes el rol necesario para ver este contenido</p>
        </div>
      ) : null)
    }
  }

  // Verificar permisos si se especifican
  if (permissions) {
    const permissionsArray = Array.isArray(permissions) ? permissions : [permissions]
    
    let hasRequiredPermissions = false
    
    if (requireAll) {
      // Requiere TODOS los permisos
      hasRequiredPermissions = hasAllPermissions(permissionsArray)
    } else {
      // Requiere AL MENOS UNO de los permisos
      hasRequiredPermissions = hasAnyPermission(permissionsArray)
    }

    if (!hasRequiredPermissions) {
      return fallback || (showError ? (
        <div className="text-amber-600 p-4 text-center bg-amber-50 rounded-lg">
          <p className="font-semibold">Permisos insuficientes</p>
          <p className="text-sm">No tienes los permisos necesarios para ver este contenido</p>
        </div>
      ) : null)
    }
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return <>{children}</>
}

// Componente específico para verificar un solo permiso
export function RequirePermission({ 
  permission, 
  children, 
  fallback,
  showError = false 
}: {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <PermissionGuard 
      permissions={permission} 
      fallback={fallback}
      showError={showError}
    >
      {children}
    </PermissionGuard>
  )
}

// Componente específico para verificar rol
export function RequireRole({ 
  role, 
  children, 
  fallback,
  showError = false 
}: {
  role: "COBRADOR" | "SUPERVISOR" | "ADMINISTRADOR" | ("COBRADOR" | "SUPERVISOR" | "ADMINISTRADOR")[]
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  const roles = Array.isArray(role) ? role : [role]
  
  return (
    <PermissionGuard 
      roles={roles} 
      fallback={fallback}
      showError={showError}
    >
      {children}
    </PermissionGuard>
  )
}

// Componente para mostrar contenido solo a administradores
export function AdminOnly({ 
  children, 
  fallback,
  showError = false 
}: {
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <RequireRole role="ADMINISTRADOR" fallback={fallback} showError={showError}>
      {children}
    </RequireRole>
  )
}

// Componente para mostrar contenido a supervisores y administradores
export function SupervisorOrAdmin({ 
  children, 
  fallback,
  showError = false 
}: {
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <RequireRole role={["SUPERVISOR", "ADMINISTRADOR"]} fallback={fallback} showError={showError}>
      {children}
    </RequireRole>
  )
}

