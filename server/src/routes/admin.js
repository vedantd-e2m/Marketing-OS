"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const supabase_1 = require("../utils/supabase");
const router = (0, express_1.Router)();
// Get all users in the organization
router.get('/users', auth_1.requireAuth, (0, rbac_1.requireRole)(['manage_users']), async (req, res) => {
    try {
        const { data: currentUserProfile, error: profileErr } = await supabase_1.supabaseAdmin
            .from('users')
            .select('organization_id')
            .eq('id', req.user.id)
            .single();
        if (profileErr || !currentUserProfile) {
            return res.status(404).json({ error: 'Current user profile not found' });
        }
        const { data: users, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('organization_id', currentUserProfile.organization_id);
        if (error)
            throw error;
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update user role
router.put('/users/:userId/role', auth_1.requireAuth, (0, rbac_1.requireRole)(['manage_users']), async (req, res) => {
    try {
        const { role } = req.body;
        const { userId } = req.params;
        if (!['owner', 'admin', 'editor', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        // Ensure we don't accidentally demote the only owner
        if (req.user.id === userId) {
            return res.status(403).json({ error: 'Cannot change your own role' });
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('users')
            .update({ role })
            .eq('id', userId)
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map