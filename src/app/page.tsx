"use client";

import React, { useState } from "react";
import { GulaDashboard } from "@/components/dashboard/gula-dashboard";
import { useUser, useAuth, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { Loader2, LogIn, LogOut, Users, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [requestEmail, setRequestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLogin = async () => {
    if (!auth) {
      toast({ title: "Firebase Belum Siap", description: "Pastikan API Key sudah terpasang di App Hosting.", variant: "destructive" });
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      toast({ title: "Login Gagal", description: error.message, variant: "destructive" });
    }
  };

  const handleRequestAccess = async () => {
    if (!db || !user?.email || !requestEmail) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, "requests"), {
        requesterEmail: user.email,
        ownerEmail: requestEmail.toLowerCase().trim(),
        status: "pending",
        timestamp: new Date().toISOString()
      });
      toast({ title: "Permintaan Terkirim", description: `Permintaan akses telah dikirim ke ${requestEmail}.` });
      setRequestEmail("");
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Gagal mengirim permintaan", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menghubungkan ke layanan kesehatan...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-primary/10">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary tracking-tight">GulaMonitor</h1>
            <p className="text-muted-foreground">Pantau gula darah Anda dan keluarga secara aman dan terintegrasi.</p>
          </div>
          <Button onClick={handleLogin} className="w-full gap-3 rounded-2xl h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            <LogIn className="h-6 w-6" /> Masuk dengan Google
          </Button>
          <p className="text-xs text-muted-foreground px-4 leading-relaxed">
            Aplikasi ini memerlukan izin Google untuk mengamankan data kesehatan pribadi Anda.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-primary tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" /> GulaMonitor
            </h1>
            <p className="text-muted-foreground font-medium">Selamat datang, {user.displayName}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2 h-11 px-6 border-primary/20 hover:bg-primary/5 font-semibold">
                  <Users className="h-4 w-4" /> Minta Akses Tamu
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-primary">Minta Akses Tamu</DialogTitle>
                  <DialogDescription className="text-base">
                    Gunakan fitur ini untuk memantau data orang lain (misal: orang tua atau pasangan).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-3">
                    <Label htmlFor="owner-email" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Email Pemilik Data
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        id="owner-email" 
                        placeholder="email@pemilikdata.com" 
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        className="rounded-xl h-12 text-lg"
                      />
                      <Button 
                        onClick={handleRequestAccess} 
                        disabled={isSending || !requestEmail} 
                        className="rounded-xl h-12 w-14"
                      >
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      *Pemilik data harus menyetujui permintaan Anda melalui menu "Bagikan" di dashboard mereka.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleLogout} className="rounded-xl gap-2 h-11 px-6 border-red-100 text-red-600 hover:bg-red-50 font-semibold">
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </div>
        </header>

        <GulaDashboard />
      </div>
    </main>
  );
}
