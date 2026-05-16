
"use client";

import React, { useMemo, useState } from "react";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, query, where, deleteDoc, doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck, Trash2, Mail, Inbox } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";

export function SharedAccessManager() {
  const db = useFirestore();
  const { user } = useUser();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Memastikan email selalu dalam format huruf kecil dan bersih
  const userEmail = useMemo(() => user?.email?.toLowerCase().trim() || "", [user]);
  const userUid = useMemo(() => user?.uid || "", [user]);

  // Query Kotak Masuk: Menampilkan permintaan yang ditujukan ke email SAYA yang sedang aktif
  const requestsQuery = useMemo(() => {
    if (!db || !userEmail) return null;
    return query(
      collection(db, "requests"), 
      where("ownerEmail", "==", userEmail)
    );
  }, [db, userEmail]);

  // Query Tamu Aktif: Menampilkan siapa saja yang telah SAYA beri izin
  const permissionsQuery = useMemo(() => {
    if (!db || !userUid) return null;
    return query(
      collection(db, "permissions"), 
      where("ownerUid", "==", userUid)
    );
  }, [db, userUid]);

  const { data: rawRequests, loading: loadingRequests } = useCollection(requestsQuery);
  const { data: permissions, loading: loadingPermissions } = useCollection(permissionsQuery);

  // Hanya tampilkan permintaan dengan status 'pending'
  const requests = useMemo(() => {
    return (rawRequests || []).filter((req: any) => req.status === "pending");
  }, [rawRequests]);

  const approveRequest = async (request: any) => {
    if (!db || !userUid || !request?.requesterEmail) return;
    
    setProcessingId(request.id);
    try {
      // Buat ID izin yang unik berdasarkan email tamu dan UID pemilik
      const permId = `${request.requesterEmail.replace(/[@.]/g, '_')}_${userUid}`;
      const permissionsRef = doc(db, "permissions", permId);
      const requestsRef = doc(db, "requests", request.id);
      
      // Simpan izin baru
      await setDoc(permissionsRef, {
        ownerUid: userUid,
        ownerEmail: userEmail,
        guestEmail: request.requesterEmail.toLowerCase().trim(),
        grantedAt: new Date().toISOString()
      });

      // Hapus permintaan dari kotak masuk setelah disetujui
      await deleteDoc(requestsRef);

      toast({ 
        title: "Akses Disetujui", 
        description: `${request.requesterEmail} kini dapat memantau data Anda.` 
      });
    } catch (err) {
      console.error("Gagal menyetujui:", err);
      toast({ title: "Gagal menyetujui permintaan", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const revokeAccess = async (permId: string) => {
    if (!db) return;
    setProcessingId(permId);
    try {
      await deleteDoc(doc(db, "permissions", permId));
      toast({ title: "Akses Dicabut", description: "Tamu tersebut tidak lagi memiliki akses." });
    } catch (err) {
      toast({ title: "Gagal mencabut akses", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const ignoreRequest = async (requestId: string) => {
    if (!db) return;
    setProcessingId(requestId);
    try {
      await deleteDoc(doc(db, "requests", requestId));
      toast({ title: "Permintaan Dihapus" });
    } catch (err) {
      toast({ title: "Gagal menghapus permintaan", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const safeFormatDate = (timestamp: any) => {
    const d = new Date(timestamp);
    return isValid(d) ? format(d, "dd MMM yyyy, HH:mm") : "Baru saja";
  };

  if (loadingRequests || loadingPermissions) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Memeriksa kotak masuk...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b px-8 py-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-800">
            <Inbox className="h-6 w-6 text-primary" /> Kotak Masuk Permintaan
          </CardTitle>
          <CardDescription>Email Anda: <b>{userEmail}</b></CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {(!requests || requests.length === 0) ? (
            <div className="text-center py-12 opacity-30 flex flex-col items-center gap-3">
              <Mail className="h-12 w-12" />
              <p className="italic font-medium">Tidak ada permintaan akses baru.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req: any) => (
                <div key={req.id} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 border rounded-[1.5rem] gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{req.requesterEmail}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {safeFormatDate(req.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => approveRequest(req)} 
                      disabled={processingId === req.id}
                      className="rounded-xl h-10 px-8 font-bold"
                    >
                      {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Setujui"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => ignoreRequest(req.id)} 
                      disabled={processingId === req.id}
                      className="rounded-xl h-10 px-4 text-red-400"
                    >
                      Abaikan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-emerald-50/50 border-b px-8 py-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-emerald-800">
            <UserCheck className="h-6 w-6 text-emerald-600" /> Tamu Aktif
          </CardTitle>
          <CardDescription>Daftar orang yang saat ini memiliki akses pemantauan.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {(!permissions || permissions.length === 0) ? (
            <div className="text-center py-12 opacity-30 flex flex-col items-center gap-3">
              <UserCheck className="h-12 w-12" />
              <p className="italic font-medium">Belum ada tamu yang terdaftar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissions.map((perm: any) => (
                <div key={perm.id} className="flex items-center justify-between p-6 bg-white border border-emerald-100 rounded-[1.5rem]">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{perm.guestEmail}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Terverifikasi</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => revokeAccess(perm.id)} 
                    disabled={processingId === perm.id}
                    className="rounded-xl w-10 h-10 text-slate-300 hover:text-red-500"
                  >
                    {processingId === perm.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
