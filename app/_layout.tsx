import { Stack } from "expo-router";
import { useEffect } from "react";
import { signInAnonymously } from "../src/lib/auth";
import { supabase } from "../src/lib/supabase";

export default function RootLayout() {
  // Ensure the user is logged in anonymously on app startup
  useEffect(() => {
    async function initAuth() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        console.log("No user found — signing in anonymously…");
        await signInAnonymously();
      } else {
        console.log("User already authenticated:", data.user.id);
      }
    }

    initAuth();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // globally hide headers by default
      }}
    />
  );
}
