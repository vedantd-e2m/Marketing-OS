import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { useDBStore } from "../../store/dbStore";
import { supabase } from "../../utils/supabaseClient";
import { toast } from "sonner";
import { User } from "../../types";

export const UserManagement: React.FC = () => {
  const { currentUser } = useDBStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error("Failed to load users. You might not have the correct permissions.");
      }
      const data = await res.json();
      setUsers(data.map((u: any) => ({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: u.role,
        organizationId: u.organization_id
      })));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update role");
      }
      
      toast.success("Role updated successfully.");
      fetchUsers(); // Refresh list
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">Users & Roles (RBAC)</CardTitle>
        <CardDescription>Manage team members and their permission levels within the organization.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading users...</p>
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 border rounded-md border-border bg-card/50">
                <div>
                  <p className="font-semibold">{u.firstName} {u.lastName} {u.id === currentUser?.id && "(You)"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={u.role || "viewer"}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.id === currentUser?.id || (currentUser?.role !== "owner" && currentUser?.role !== "admin")}
                    options={[
                      { value: "owner", label: "Owner (Full Access)" },
                      { value: "admin", label: "Admin (Manage Users & Execute)" },
                      { value: "editor", label: "Editor (Write & Execute Jobs)" },
                      { value: "viewer", label: "Viewer (Read Only)" }
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
