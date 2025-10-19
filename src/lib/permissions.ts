/**
 * Role-Based Access Control (RBAC) utilities for frontend
 */

// Define the permission system matching backend
export const PERMISSIONS = {
  // User Management
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  
  // Patient Management
  PATIENTS_CREATE: 'patients.create',
  PATIENTS_READ: 'patients.read',
  PATIENTS_UPDATE: 'patients.update',
  PATIENTS_DELETE: 'patients.delete',
  
  // Medical Records
  MEDICAL_RECORDS_CREATE: 'medical_records.create',
  MEDICAL_RECORDS_READ: 'medical_records.read',
  MEDICAL_RECORDS_UPDATE: 'medical_records.update',
  MEDICAL_RECORDS_DELETE: 'medical_records.delete',
  
  // Appointments
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_READ: 'appointments.read',
  APPOINTMENTS_UPDATE: 'appointments.update',
  APPOINTMENTS_DELETE: 'appointments.delete',
  
  // Billing & Financial
  BILLING_READ: 'billing.read',
  BILLING_CREATE: 'billing.create',
  BILLING_UPDATE: 'billing.update',
  INVOICES_READ: 'invoices.read',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_UPDATE: 'invoices.update',
  
  // System Administration
  SYSTEM_ADMIN: 'system.admin',
  AUDIT_LOGS_READ: 'audit_logs.read',
  
  // Consultation Management
  CONSULTATIONS_CREATE: 'consultations.create',
  CONSULTATIONS_READ: 'consultations.read',
  CONSULTATIONS_UPDATE: 'consultations.update',
  CONSULTATIONS_DELETE: 'consultations.delete',
  
  // Prescriptions
  PRESCRIPTIONS_CREATE: 'prescriptions.create',
  PRESCRIPTIONS_READ: 'prescriptions.read',
  PRESCRIPTIONS_UPDATE: 'prescriptions.update',
  PRESCRIPTIONS_DELETE: 'prescriptions.delete',
  
  // Reports
  REPORTS_READ: 'reports.read',
  REPORTS_CREATE: 'reports.create',
  
  // Team Management
  TEAM_MANAGEMENT_READ: 'team_management.read',
  TEAM_MANAGEMENT_CREATE: 'team_management.create',
  TEAM_MANAGEMENT_UPDATE: 'team_management.update',
  TEAM_MANAGEMENT_DELETE: 'team_management.delete',
} as const;

// Define default roles and their permissions
export const ROLE_PERMISSIONS = {
  superadmin: Object.values(PERMISSIONS), // All permissions
  admin: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.PATIENTS_DELETE,
    PERMISSIONS.MEDICAL_RECORDS_CREATE,
    PERMISSIONS.MEDICAL_RECORDS_READ,
    PERMISSIONS.MEDICAL_RECORDS_UPDATE,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.APPOINTMENTS_DELETE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.INVOICES_READ,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.INVOICES_UPDATE,
    PERMISSIONS.CONSULTATIONS_CREATE,
    PERMISSIONS.CONSULTATIONS_READ,
    PERMISSIONS.CONSULTATIONS_UPDATE,
    PERMISSIONS.PRESCRIPTIONS_CREATE,
    PERMISSIONS.PRESCRIPTIONS_READ,
    PERMISSIONS.PRESCRIPTIONS_UPDATE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.TEAM_MANAGEMENT_READ,
    PERMISSIONS.TEAM_MANAGEMENT_CREATE,
    PERMISSIONS.TEAM_MANAGEMENT_UPDATE,
    PERMISSIONS.AUDIT_LOGS_READ,
  ],
  doctor: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.MEDICAL_RECORDS_CREATE,
    PERMISSIONS.MEDICAL_RECORDS_READ,
    PERMISSIONS.MEDICAL_RECORDS_UPDATE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.CONSULTATIONS_CREATE,
    PERMISSIONS.CONSULTATIONS_READ,
    PERMISSIONS.CONSULTATIONS_UPDATE,
    PERMISSIONS.PRESCRIPTIONS_CREATE,
    PERMISSIONS.PRESCRIPTIONS_READ,
    PERMISSIONS.PRESCRIPTIONS_UPDATE,
    PERMISSIONS.REPORTS_READ,
  ],
  receptionist: [
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.APPOINTMENTS_DELETE,
    PERMISSIONS.MEDICAL_RECORDS_READ,
    PERMISSIONS.CONSULTATIONS_READ,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.INVOICES_READ,
  ],
  financial: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.INVOICES_READ,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.INVOICES_UPDATE,
    PERMISSIONS.REPORTS_READ,
  ],
  patient: [
    PERMISSIONS.PATIENTS_READ, // Can only read their own data
    PERMISSIONS.MEDICAL_RECORDS_READ,
    PERMISSIONS.APPOINTMENTS_READ,
  ],
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Get permissions for a user role
 */
export function getRolePermissions(role: string): Permission[] {
  const normalizedRole = role.toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[normalizedRole] || [];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: string, requiredPermission: Permission): boolean {
  const userPermissions = getRolePermissions(userRole);
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userRole: string, requiredPermissions: Permission[]): boolean {
  const userPermissions = getRolePermissions(userRole);
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(userRole: string, requiredPermissions: Permission[]): boolean {
  const userPermissions = getRolePermissions(userRole);
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Get user permissions as array
 */
export function getUserPermissions(userRole: string): Permission[] {
  return getRolePermissions(userRole);
}

/**
 * Check if user can access a specific route/section
 */
export function canAccessRoute(userRole: string, requiredPermissions: Permission[]): boolean {
  if (!userRole) return false;
  
  // Superadmin has access to everything
  if (userRole.toLowerCase() === 'superadmin') return true;
  
  // Check if user has any of the required permissions
  return hasAnyPermission(userRole, requiredPermissions);
}
