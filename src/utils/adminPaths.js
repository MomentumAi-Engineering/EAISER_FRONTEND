/**
 * Admin Path Helper
 * 
 * Generates correct navigation paths based on whether we're on:
 * - admin.eaiser.ai (subdomain mode): /dashboard, /auth/login, /settings
 * - eaiser.ai (legacy mode): /admin/dashboard, /admin, /admin/settings
 * 
 * Usage:
 *   import { adminPath, isAdminSubdomain } from '../utils/adminPaths';
 *   navigate(adminPath('/dashboard'));  // → /dashboard on subdomain, /admin/dashboard on main
 */

export function isAdminSubdomain() {
    const hostname = window.location.hostname;
    return (
        hostname.startsWith('admin.') ||
        hostname === 'admin.eaiser.ai'
    );
}

/**
 * Get the correct admin path depending on the current domain.
 * 
 * @param {string} path - Clean path like '/dashboard', '/auth/login', '/settings'
 * @returns {string} Full path with or without /admin prefix
 * 
 * Examples on admin subdomain:
 *   adminPath('/dashboard')     → '/dashboard'
 *   adminPath('/auth/login')    → '/auth/login'
 *   adminPath('/settings')      → '/settings'
 * 
 * Examples on main domain:
 *   adminPath('/dashboard')     → '/admin/dashboard'
 *   adminPath('/auth/login')    → '/admin'  (special case: login page)
 *   adminPath('/settings')      → '/admin/settings'
 */
export function adminPath(path) {
    if (isAdminSubdomain()) {
        return path; // Clean paths on subdomain
    }

    // Legacy /admin/* prefix on main domain
    if (path === '/auth/login' || path === '/login') {
        return '/admin';
    }
    return `/admin${path}`;
}

/**
 * Get the admin login path.
 */
export function adminLoginPath() {
    return adminPath('/auth/login');
}

/**
 * Get the admin dashboard path.
 */
export function adminDashboardPath() {
    return adminPath('/dashboard');
}

export default adminPath;
