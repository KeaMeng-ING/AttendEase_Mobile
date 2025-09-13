// app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import "./globals.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="auth/signup"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
