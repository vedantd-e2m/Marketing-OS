"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const express_1 = require("express");
const supabase_1 = require("../utils/supabase");
const auth_1 = require("./auth");
// Define which roles can perform which actions
const rolePermissions = {
    owner: ['read', 'write', 'delete', 'execute', 'manage_users'],
    admin: ['read', 'write', 'delete', 'execute', 'manage_users'],
    editor: ['read', 'write', 'execute'],
    viewer: ['read']
};
const requireRole = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized: No user found' });
            }
            // Fetch the user's role from the users table
            const { data: profile, error } = await supabase_1.supabaseAdmin
                .from('users')
                .select('role')
                .eq('id', req.user.id)
                .single();
            if (error || !profile) {
                return res.status(403).json({ error: 'Forbidden: Profile not found' });
            }
            const userRole = profile.role || 'viewer';
            const userPermissions = rolePermissions[userRole] || [];
            // Check if the user has AT LEAST ONE of the required permissions
            const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));
            if (!hasPermission) {
                return res.status(403).json({
                    error: 'Forbidden: Insufficient permissions',
                    details: `Requires one of: ${requiredPermissions.join(', ')}`
                });
            }
            next();
        }
        catch (err) {
            console.error('RBAC middleware error:', err);
            return res.status(500).json({ error: 'Internal server error during authorization check' });
        }
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=rbac.js.map