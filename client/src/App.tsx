import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// Layout & Protection
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { supabase } from "./utils/supabaseClient";
import { useDBStore } from "./store/dbStore";

// Views
import { AuthPages } from "./features/auth/AuthPages";
import { UpdatePassword } from "./features/auth/UpdatePassword";
import { Dashboard } from "./features/dashboard/Dashboard";
import { Clients } from "./features/clients/Clients";
import { ClientDetails } from "./features/clients/ClientDetails";
import { CampaignDetails } from "./features/campaigns/CampaignDetails";
import { ClientCampaigns } from "./features/campaigns/ClientCampaigns";
import { Reports } from "./features/reports/Reports";
import { Settings } from "./features/settings/Settings";

// Instantiate TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const setCurrentUser = useDBStore((state) => state.setCurrentUser);
  const setAuthLoading = useDBStore((state) => state.setAuthLoading);
  const initialHash = React.useRef(window.location.hash);

  React.useEffect(() => {
    // 1. Sync session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setAuthLoading(false));
        
        // If they already have a session but landed with an invite hash on load
        if (sessionStorage.getItem('authRedirect') === '/update-password') {
          sessionStorage.removeItem('authRedirect');
          window.location.hash = "";
          window.location.href = "/update-password";
        }
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    // 2. Listen for auth changes (like clicking a magic link or invite link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") && session?.user) {
        fetchProfile(session.user.id);
        
        // Redirect to password setup if they clicked an invite, recovery, or magic link
        if (event === "PASSWORD_RECOVERY" || sessionStorage.getItem('authRedirect') === '/update-password') {
          sessionStorage.removeItem('authRedirect'); // Clear it so it doesn't loop
          window.location.hash = ""; // Clear hash
          window.location.href = "/update-password";
        }
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUser]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("users").select("*").eq("id", userId).single();
    if (data) {
      setCurrentUser({
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        role: data.role,
        organizationId: data.organization_id,
        clientId: data.client_id
      });
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth routes */}
          <Route path="/login" element={<AuthPages />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Protected Dashboard panel layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            
            {/* Clients Module */}
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetails />} />
            
            {/* Campaigns Module details */}
            <Route path="campaigns" element={<ClientCampaigns />} />
            <Route path="campaigns/:id" element={<CampaignDetails />} />
            
            {/* Reports Module */}
            <Route path="reports" element={<Reports />} />
            
            {/* Settings Module */}
            <Route path="settings" element={<Settings />} />

            {/* Fallback route redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      
      {/* Toast notifications popups */}
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  );
}

export default App;
