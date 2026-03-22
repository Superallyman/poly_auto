"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase"; // Using the utility we updated with isServer check
import { Session, User, SupabaseClient } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  supabase: SupabaseClient; // Required by the type, provided by the utility
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{
    data: { user: User | null } | null;
    error: Error | null;
  }>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isSubscriber: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriber, setIsSubscriber] = useState(false);

  // Helper to check subscription status
  const checkSubscription = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", userId).in("status", ["active", "trialing"]).order("created_at", { ascending: false }).maybeSingle();

      if (error) {
        console.error("Subscription check error:", error);
        setIsSubscriber(false);
        return;
      }

      const isValid = data && ["active", "trialing"].includes(data.status) && new Date(data.current_period_end) > new Date();

      setIsSubscriber(!!isValid);
    } catch (error) {
      console.error("Subscription check error:", error);
      setIsSubscriber(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // This logic ONLY runs on the client (browser)
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Set a maximum "wait time" for auth (e.g., 5 seconds)
        const timeoutId = setTimeout(() => {
          if (mounted) setIsLoading(false);
        }, 5000);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        clearTimeout(timeoutId); // Auth responded, clear the safety timer

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) await checkSubscription(session.user.id);
          setIsLoading(false); // Explicitly finish loading
        }
      } catch (err) {
        console.error(err);
        if (mounted) setIsLoading(false);
      }
    };

    
    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [checkSubscription]);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    supabase, // The singleton is safe here because active logic is gated in useEffect
    isSubscriber,
    signInWithGoogle: async () => {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    },
    signInWithEmail: async (email: string, password: string) => {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Reactivation logic for soft-deleted users
      const { data: profile } = await supabase.from("users").select("is_deleted").eq("id", authData.user?.id).single();

      if (profile?.is_deleted) {
        await supabase.from("users").update({ is_deleted: false, deleted_at: null, reactivated_at: new Date().toISOString() }).eq("id", authData.user?.id);
      }

      return authData;
    },
    signOut: async () => {
      try {
        window.dispatchEvent(new Event("cleanup-before-logout"));
        await new Promise((resolve) => setTimeout(resolve, 100));
        await supabase.auth.signOut();
        window.location.assign("/login");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    },
    signUpWithEmail: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return { data, error };
    },
    updatePassword: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    updateEmail: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
