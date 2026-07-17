import { useDBStore } from "../store/dbStore";
import { loginSchema, signupSchema } from "../schemas";
import { User } from "../types";
import { z } from "zod";
import { supabase } from "../utils/supabaseClient";

type LoginInput = z.infer<typeof loginSchema>;
type SignupInput = z.infer<typeof signupSchema>;

export const AuthService = {
  login: async (data: LoginInput): Promise<void> => {
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

    if (profileError || !profile) {
      throw new Error("Profile not found. Please contact support or try signing up again.");
    }

    useDBStore.getState().setCurrentUser({
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      organizationId: profile.organization_id,
      role: profile.role,
      clientId: profile.client_id,
    });
  },

  signup: async (data: SignupInput): Promise<any> => {
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
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
    useDBStore.getState().setCurrentUser(null);
  },

  forgotPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },

  getCurrentUser: (): User | null => {
    return useDBStore.getState().currentUser;
  },
};
