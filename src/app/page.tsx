
"use client";

import React, { useState, useEffect } from "react";
import { GulaDashboard } from "@/components/dashboard/gula-dashboard";
import { useUser, useAuth, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { Loader2, LogIn, Send, ShieldCheck, Users, Key, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [requestEmail, setRequestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<'login' | 'request' | null>(null);

  useEffect(() => {
    if (user && initialAction === 'request') {
      setIsDialogOpen(true);
      setInitialAction(null);
    }
  }, [user, initialAction]);

  const handleAuth = async (action: 'login' | 'request') => {
    if (!auth) {
      toast({ title: "Firebase Belum Siap", description: "Pastikan API Key sudah terpasang.", variant: "destructive" });
      return;
    }
    setInitialAction(action);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      toast({ title: "Gagal Autentikasi", description: error.message, variant: "destructive" });
    }
  };

  const handleRequestAccess = async () => {
    if (!db || !user?.email || !requestEmail) return;
    setIsSending(true);
    const targetEmail = requestEmail.toLowerCase().trim();
    const myEmail = user.email.toLowerCase();

    try {
      await addDoc(collection(db, "requests"), {
        requesterEmail: myEmail,
        ownerEmail: targetEmail,
        status: "pending",
        timestamp: new Date().toISOString()
      });
      toast({ title: "Permintaan Terkirim", description: `Permintaan akses telah dikirim ke ${targetEmail}. Tunggu persetujuan.` });
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 font-body">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Menghubungkan ke GulaMonitor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/5 font-body">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center md:text-left">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto md:mx-0 shadow-2xl shadow-primary/30">
              <ShieldCheck className="h-12 w-12 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-6xl font-black text-slate-900 tracking-tight">GulaMonitor <span className="text-primary">Sync</span></h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
                Sistem pemantauan kesehatan tersinkronisasi. Aman, privat, dan terkendali.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
              <CardHeader className="p-8 text-center space-y-2">
                <CardTitle className="text-3xl font-black text-slate-800">Pilih Akses</CardTitle>
                <CardDescription className="text-base">Gunakan akun Google Anda</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                <div className="grid gap-4">
                  <Button 
                    onClick={() => handleAuth('login')} 
                    className="w-full h-16 rounded-2xl text-lg font-bold gap-3 shadow-lg shadow-primary/20 transition-all"
                  >
                    <LogIn className="h-6 w-6" /> Login (Owner / Guest)
                  </Button>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-muted-foreground font-bold">atau</span></div>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => handleAuth('request')} 
                    className="w-full h-16 rounded-2xl text-lg font-bold gap-3 border-2 border-primary/10 hover:bg-primary/5 transition-all"
                  >
                    <Key className="h-6 w-6 text-primary" /> Minta Akses Baru
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50/50 font-body">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-primary tracking-tight flex items-center gap-3">
              <ShieldCheck className="h-8 w-8" /> GulaMonitor
            </h1>
            <p className="text-muted-foreground font-bold flex items-center gap-2">
              Aktif: {user.displayName || user.email}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2 h-12 px-6 border-primary/20 hover:bg-primary/5 font-bold">
                  <Key className="h-4 w-4" /> Minta Akses
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem] sm:max-w-md p-8">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-3xl font-black text-primary">Kirim Permintaan</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-3">
                    <Label htmlFor="owner-email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Email Pemilik Data
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        id="owner-email" 
                        placeholder="surya.ongko@gmail.com" 
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        className="rounded-2xl h-14 text-lg font-medium bg-slate-50 border-none"
                      />
                      <Button onClick={handleRequestAccess} disabled={isSending || !requestEmail} className="rounded-2xl h-14 w-16">
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleLogout} className="rounded-xl gap-2 h-12 px-6 border-red-100 text-red-600 font-bold">
              <ArrowRight className="h-4 w-4" /> Keluar
            </Button>
          </div>
        </header>

        <GulaDashboard />
      </div>
    </main>
  );
}
