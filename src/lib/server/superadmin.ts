/**
 * SuperAdmin utility for SCL v3.
 * Determines if a user is a SuperAdmin based on their email address.
 */

/**
 * Check if an email address belongs to a SuperAdmin.
 * SuperAdmins are identified by emails containing "vasso" or "vaseo" (case-insensitive).
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    return lowerEmail.includes("vasso") || lowerEmail.includes("vaseo");
}

/**
 * Role constants for clarity.
 */
export const SuperAdminEmails = {
    patterns: ["vasso", "vaseo"],
    description: "Email addresses containing 'vasso' or 'vaseo' are SuperAdmins",
};
