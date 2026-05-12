
"use client";

import { GulaDashboard } from "@/components/dashboard/gula-dashboard";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Loader2, LogIn, LogOut } from "lucide-react";

export default function Home() {
  const { user, loading } = useUser();
  const auth = useAuth();

  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-md w-full text-center space-y-8 bg-white p-8 rounded-3xl shadow-xl">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">GulaMonitor</h1>
            <p className="text-muted-foreground">Monitor gula darah Anda secara pribadi dan aman.</p>
          </div>
          <div className="p-6 bg-primary/5 rounded-2xl">
            <p className="text-sm text-slate-600 mb-6">
              Silakan masuk dengan akun Google Anda untuk mengakses data kesehatan pribadi Anda.
            </p>
            <Button onClick={handleLogin} className="w-full gap-2 rounded-xl h-12 text-lg font-semibold">
              <LogIn className="h-5 w-5" />
              Masuk dengan Google
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline">GulaMonitor</h1>
            <p className="text-muted-foreground">Selamat datang, {user.displayName}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleLogout} className="rounded-xl gap-2 border-red-200 text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
            <span className="hidden md:inline-flex text-sm font-medium bg-secondary/10 text-secondary px-3 py-1 rounded-full">
              Live Health Sync
            </span>
          </div>
        </header>

        <GulaDashboard />
      </div>
    </main>
  );
}
