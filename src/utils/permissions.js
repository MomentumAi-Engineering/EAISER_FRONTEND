/**
 * Role-Based Access Control Utilities
 * Matches backend permission matrix
 */

const PERMISSIONS = {
    create_admin: ['super_admin'],
    create_team_member: ['super_admin', 'admin'],
    assign_issue: ['super_admin', 'admin'],
    view_all_issues: ['super_admin', 'admin'],
    view_assigned_issues: ['super_admin', 'admin', 'team_member'],
    approve_assigned: ['super_admin', 'admin', 'team_member'],
    decline_assigned: ['super_admin', 'admin', 'team_member'],
    view_stats: ['super_admin', 'admin', 'viewer'],
    manage_team: ['super_admin'],
    manage_users: ['super_admin']
};

/**
 * Get current admin data from localStorage
 */
export function getCurrentAdmin() {
    try {
        const adminData = localStorage.getItem('adminData');
        return adminData ? JSON.parse(adminData) : null;
    } catch (err) {
        console.error('Failed to get admin data:', err);
        return null;
    }
}

/**
 * Check if current admin has a specific permission
 */
export function hasPermission(permission) {
    const admin = getCurrentAdmin();
    if (!admin || !admin.role) return false;

    const allowedRoles = PERMISSIONS[permission] || [];
    return allowedRoles.includes(admin.role);
}

/**
 * Check if current admin has a specific role
 */
export function hasRole(role) {
    const admin = getCurrentAdmin();
    return admin && admin.role === role;
}

/**
 * Check if current admin has any of the specified roles
 */
export function hasAnyRole(roles) {
    const admin = getCurrentAdmin();
    if (!admin || !admin.role) return false;
    return roles.includes(admin.role);
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role) {
    const roleNames = {
        super_admin: 'Super Admin',
        admin: 'Admin',
        team_member: 'Team Member',
        viewer: 'Viewer'
    };
    return roleNames[role] || role;
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role) {
    const colors = {
        super_admin: 'bg-purple-500',
        admin: 'bg-blue-500',
        team_member: 'bg-green-500',
        viewer: 'bg-gray-500'
    };
    return colors[role] || 'bg-gray-400';
}

/**
 * Check if admin can perform action on issue
 */
export function canActOnIssue(issue) {
    const admin = getCurrentAdmin();
    if (!admin) return false;

    // Super admin can act on all issues
    if (admin.role === 'super_admin') return true;

    // Admin can act on all issues
    if (admin.role === 'admin') return true;

    // Team member can only act on assigned issues
    if (admin.role === 'team_member') {
        return issue.assigned_to === admin.email;
    }

    // Viewer cannot act on any issues
    return false;
}

/**
 * Permission-based component wrapper
 */
export function PermissionGate({ permission, children, fallback = null }) {
    return hasPermission(permission) ? children : fallback;
}

/**
 * Role-based component wrapper
 */
export function RoleGate({ roles, children, fallback = null }) {
    return hasAnyRole(roles) ? children : fallback;
}

export default {
    getCurrentAdmin,
    hasPermission,
    hasRole,
    hasAnyRole,
    getRoleName,
    getRoleBadgeColor,
    canActOnIssue,
    PermissionGate,
    RoleGate,
    PERMISSIONS
};
