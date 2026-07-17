import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { AuthenticatedRequest } from './auth';

type Role = 'owner' | 'admin' | 'editor' | 'viewer' | 'client';

// Define which roles can perform which actions
const rolePermissions: Record<Role, string[]> = {
  owner: ['read', 'write', 'delete', 'execute', 'manage_users'],
  admin: ['read', 'write', 'delete', 'execute', 'manage_users'],
  editor: ['read', 'write', 'execute'],
  viewer: ['read'],
  client: ['read', 'write', 'execute']
};

export const requireRole = (requiredPermissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: No user found' });
      }

      // Fetch the user's role from the users table
      const { data: profile, error } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({ error: 'Forbidden: Profile not found' });
      }

      const userRole = (profile.role as Role) || 'viewer';
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
    } catch (err) {
      console.error('RBAC middleware error:', err);
      return res.status(500).json({ error: 'Internal server error during authorization check' });
    }
  };
};
