
"use client";

import React, { useState } from "react";
import { GulaDashboard } from "@/components/dashboard/gula-dashboard";
import { useUser, useAuth, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, LogIn, LogOut, AlertCircle, Users, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [requestEmail, setRequestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleLogin = async () => {
    if (!auth) {
      toast({ title: "Firebase Belum Siap", variant: "destructive" });
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
        ownerEmail: requestEmail,
        status: "pending",
        timestamp: new Date().toISOString()
      });
      toast({ title: "Permintaan Terkirim", description: `Permintaan akses telah dikirim ke pemilik data (${requestEmail}).` });
      setRequestEmail("");
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-md w-full text-center space-y-8 bg-white p-8 rounded-3xl shadow-xl">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">GulaMonitor</h1>
            <p className="text-muted-foreground">Monitor gula darah secara aman dan terintegrasi.</p>
          </div>
          <Button onClick={handleLogin} className="w-full gap-2 rounded-xl h-12 text-lg font-semibold">
            <LogIn className="h-5 w-5" /> Masuk dengan Google
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">GulaMonitor</h1>
            <p className="text-muted-foreground">Halo, {user.displayName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2">
                  <Users className="h-4 w-4" /> Minta Akses Tamu
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Minta Akses Pemantauan</DialogTitle>
                  <DialogDescription>Masukkan email pemilik data yang ingin Anda pantau.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner-email">Email Pemilik Data</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="owner-email" 
                        placeholder="contoh@gmail.com" 
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        className="rounded-xl"
                      />
                      <Button onClick={handleRequestAccess} disabled={isSending || !requestEmail} className="rounded-xl">
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleLogout} className="rounded-xl gap-2 border-red-100 text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </div>
        </header>

        <GulaDashboard />
      </div>
    </main>
  );
}
