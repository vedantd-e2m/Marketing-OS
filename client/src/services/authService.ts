import { useDBStore } from "../store/dbStore";
import { loginSchema, signupSchema } from "../schemas";
import { User } from "../types";
import { z } from "zod";
import { supabase, appConfig } from "../utils/supabaseClient";

type LoginInput = z.infer<typeof loginSchema>;
type SignupInput = z.infer<typeof signupSchema>;

const DELAY = 800; // Simulated latency

const isRealSupabase = () => {
  const url = appConfig?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
  return !!url && !url.includes("placeholder-marketing-os");
};

export const AuthService = {
  login: async (data: LoginInput): Promise<void> => {
    if (isRealSupabase()) {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Could not verify session user details.");

      // 2. Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        // Fallback: If user has auth account but no row in public.users, create defaults
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert([{ name: "My Agency Workspace" }])
          .select()
          .single();

        if (orgError) throw new Error(orgError.message);

        const { error: insertProfileError } = await supabase
          .from("users")
          .insert([{
            id: authData.user.id,
            organization_id: org.id,
            first_name: "Alex",
            last_name: "Mercer",
            email: data.email,
            role: "owner"
          }]);

        if (insertProfileError) throw new Error(insertProfileError.message);

        useDBStore.getState().setCurrentUser({
          id: authData.user.id,
          firstName: "Alex",
          lastName: "Mercer",
          email: data.email,
          organizationId: org.id,
        });
      } else {
        useDBStore.getState().setCurrentUser({
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
          organizationId: profile.organization_id,
          role: profile.role,
          clientId: profile.client_id,
        });
      }
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const mockUser = {
            id: "usr_123456",
            firstName: "Alex",
            lastName: "Mercer",
            email: data.email,
          };

          if (data.email === "error@marketingos.com") {
            reject(new Error("Invalid email or password. Please try again."));
            return;
          }

          useDBStore.getState().setCurrentUser(mockUser);
          resolve();
        }, DELAY);
      });
    }
  },

  signup: async (data: SignupInput): Promise<any> => {
    if (isRealSupabase()) {
      // 1. Sign up with Supabase Auth
      // The database trigger (on_auth_user_created) will automatically handle the profile and org creation 
      // using the metadata provided in 'options.data'.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: "owner"
          }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Could not register user account.");

      // If session is null, it means email confirmation is required.
      if (!authData.session) {
        return { requiresEmailVerification: true };
      }

      // If email confirmation is disabled, they are logged in immediately.
      // App.tsx's onAuthStateChange will automatically fetch the profile and set currentUser.
    } else {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (data.email === "exists@marketingos.com") {
            reject(new Error("An account with this email address already exists."));
            return;
          }

          const newUser = {
            id: `usr_${Math.random().toString(36).substr(2, 9)}`,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
          };

          useDBStore.getState().setCurrentUser(newUser);
          resolve();
        }, DELAY);
      });
    }
  },

  logout: async (): Promise<void> => {
    if (isRealSupabase()) {
      await supabase.auth.signOut();
    }
    useDBStore.getState().setCurrentUser(null);
  },

  forgotPassword: async (email: string): Promise<void> => {
    if (isRealSupabase()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message);
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (email === "notfound@marketingos.com") {
            reject(new Error("No account found with this email address."));
            return;
          }
          resolve();
        }, DELAY);
      });
    }
  },

  getCurrentUser: (): User | null => {
    return useDBStore.getState().currentUser;
  },
};
