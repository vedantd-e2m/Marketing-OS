import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { supabaseAdmin } from '../utils/supabase';
import fs from 'fs';
import path from 'path';

const router = Router();

// --- Admin & Client Data overrides below ---

// Fallback to fetch campaigns if RLS is failing for clients
router.get('/me/campaigns', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user.role;
    const orgId = req.user.organization_id;
    const clientId = req.user.client_id;

    let query = supabaseAdmin.from('campaigns').select('*').eq('organization_id', orgId).order('created_at', { ascending: false });

    if (userRole === 'client') {
      if (!clientId) {
        return res.json([]);
      }
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Get all users in the organization
router.get('/users', requireAuth, requireRole(['manage_users']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const { data: currentUserProfile, error: profileErr } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', req.user.id)
      .single();

    if (profileErr || !currentUserProfile) {
      return res.status(404).json({ error: 'Current user profile not found' });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('organization_id', currentUserProfile.organization_id);

    if (error) throw error;
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.put('/users/:userId/role', requireAuth, requireRole(['manage_users']), async (req: AuthenticatedRequest, res: any) => {
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

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Invite a new client user
router.post('/invite-client', requireAuth, requireRole(['manage_users']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const { email, firstName, lastName, clientId, redirectTo } = req.body;
    
    if (!email || !firstName || !lastName || !clientId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current org
    const { data: currentUserProfile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', req.user.id)
      .single();

    if (!currentUserProfile) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // 1. Generate Invite Link via Supabase Auth Admin API (bypasses email delivery)
    let { data: authData, error: authErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: redirectTo || 'http://localhost:5173/login'
      }
    });
    
    // Fallback if the user already exists in auth.users
    if (authErr && (authErr as any).code === 'email_exists') {
      const magicLinkRes = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: redirectTo || 'http://localhost:5173/login'
        }
      });
      authData = magicLinkRes.data;
      authErr = magicLinkRes.error;
    }

    if (authErr) throw authErr;
    if (!authData.user) throw new Error("User creation failed");

    // 2. Map the new auth user to the public users table with role 'client'
    const { data: newUser, error: dbErr } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: 'client',
        client_id: clientId,
        organization_id: currentUserProfile.organization_id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (dbErr) throw dbErr;

    res.json({
      user: newUser,
      action_link: authData.properties?.action_link
    });
  } catch (error: any) {
    console.error('Invite Client Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a client and their associated user account
router.delete('/clients/:clientId', requireAuth, requireRole(['manage_users']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const { clientId } = req.params;

    // 1. Get the client's email before we delete them, so we can rigorously clean up auth.users
    const { data: clientData, error: clientFetchErr } = await supabaseAdmin
      .from('clients')
      .select('contact_email')
      .eq('id', clientId)
      .single();

    const clientEmail = clientData?.contact_email;

    // 2. Find any user associated with this client in public.users by client_id OR email
    let usersToDelete: any[] = [];
    
    const { data: usersByClientId } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('client_id', clientId);
      
    if (usersByClientId) usersToDelete = [...usersToDelete, ...usersByClientId];

    if (clientEmail) {
      const { data: usersByEmail } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', clientEmail);
        
      if (usersByEmail) {
        for (const user of usersByEmail) {
          if (!usersToDelete.find(u => u.id === user.id)) {
            usersToDelete.push(user);
          }
        }
      }
    }

    // 3. Delete from public.users to remove foreign key dependencies and auth.users
    if (usersToDelete.length > 0) {
      for (const user of usersToDelete) {
        const { error: dbUserErr } = await supabaseAdmin.from('users').delete().eq('id', user.id);
        if (dbUserErr) console.warn("Failed to delete from public.users:", dbUserErr);

        const { error: authUserErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (authUserErr) console.warn("Failed to delete from auth.users:", authUserErr);
      }
    }

    // 4. Ultra-strict cleanup: Find by email in auth.users just in case they were orphaned
    if (clientEmail) {
      let hasNextPage = true;
      let page = 1;
      while (hasNextPage) {
        const { data: authListData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 100
        });
        
        if (listErr) throw listErr;
        
        if (authListData && authListData.users && authListData.users.length > 0) {
          const matchingUser = authListData.users.find(u => u.email === clientEmail);
          if (matchingUser) {
            await supabaseAdmin.auth.admin.deleteUser(matchingUser.id);
            break; // Found and deleted
          }
          if (authListData.users.length < 100) {
            hasNextPage = false;
          } else {
            page++;
          }
        } else {
          hasNextPage = false;
        }
      }
    }

    // 5. Delete the client from the clients table
    const { error: clientDelErr } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', clientId);
      
    if (clientDelErr) throw clientDelErr;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete Client Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
