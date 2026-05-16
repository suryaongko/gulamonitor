
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
  
  const userEmail = useMemo(() => user?.email?.toLowerCase().trim() || "", [user]);
  const userUid = useMemo(() => user?.uid || "", [user]);

  // Query Kotak Masuk (Hanya menampilkan email yang ditujukan ke SAYA)
  const requestsQuery = useMemo(() => {
    if (!db || !userEmail) return null;
    return query(
      collection(db, "requests"), 
      where("ownerEmail", "==", userEmail)
    );
  }, [db, userEmail]);

  // Query Tamu Aktif (Tamu yang saya beri izin)
  const permissionsQuery = useMemo(() => {
    if (!db || !userUid) return null;
    return query(
      collection(db, "permissions"), 
      where("ownerUid", "==", userUid)
    );
  }, [db, userUid]);

  const { data: rawRequests, loading: loadingRequests } = useCollection(requestsQuery);
  const { data: permissions, loading: loadingPermissions } = useCollection(permissionsQuery);

  // Filter status pending di sisi klien untuk menghindari kebutuhan Composite Index Firestore
  const requests = useMemo(() => {
    return (rawRequests || []).filter((req: any) => req.status === "pending");
  }, [rawRequests]);

  const approveRequest = async (request: any) => {
    if (!db || !user || !userUid || !request?.requesterEmail) return;
    
    setProcessingId(request.id);
    try {
      const permId = `${request.requesterEmail}_${userUid}`.replace(/[@.]/g, '_');
      const permissionsRef = doc(db, "permissions", permId);
      const requestsRef = doc(db, "requests", request.id);
      
      // 1. Tambahkan ke daftar izin
      await setDoc(permissionsRef, {
        ownerUid: userUid,
        ownerEmail: userEmail,
        guestEmail: request.requesterEmail,
        grantedAt: new Date().toISOString()
      });

      // 2. Hapus permintaan dari inbox
      await deleteDoc(requestsRef);

      toast({ 
        title: "Akses Disetujui", 
        description: `${request.requesterEmail} sekarang bisa memantau data Anda.` 
      });
    } catch (err: any) {
      console.error("Approval Error:", err);
      toast({ title: "Gagal Menyetujui", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const revokeAccess = async (permId: string) => {
    if (!db) return;
    setProcessingId(permId);
    try {
      await deleteDoc(doc(db, "permissions", permId));
      toast({ title: "Akses Dicabut" });
    } catch (err) {
      toast({ title: "Gagal Mencabut Akses", variant: "destructive" });
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
      toast({ title: "Gagal Menghapus", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const safeFormatDate = (timestamp: any) => {
    if (!timestamp) return "Baru saja";
    const d = new Date(timestamp);
    return isValid(d) ? format(d, "dd MMM yyyy, HH:mm") : "Baru saja";
  };

  if (loadingRequests || loadingPermissions) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Memuat data...</p>
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
          <CardDescription>Daftar tamu yang menunggu persetujuan Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {(!requests || requests.length === 0) ? (
            <div className="text-center py-12 opacity-30 flex flex-col items-center gap-3">
              <Mail className="h-12 w-12" />
              <p className="italic font-medium">Kotak masuk kosong.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req: any) => (
                <div key={req.id} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 border rounded-[1.5rem] gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate max-w-[200px]">{req.requesterEmail}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {safeFormatDate(req.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => approveRequest(req)} 
                      disabled={processingId === req.id}
                      className="rounded-xl h-10 px-8 font-bold shadow-md"
                    >
                      {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Setujui"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => ignoreRequest(req.id)} 
                      disabled={processingId === req.id}
                      className="rounded-xl h-10 px-4 text-red-400 hover:text-red-500"
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
            <UserCheck className="h-6 w-6 text-emerald-600" /> Daftar Tamu Terpilih
          </CardTitle>
          <CardDescription>Akun yang diizinkan memantau data Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {(!permissions || permissions.length === 0) ? (
            <div className="text-center py-12 opacity-30 flex flex-col items-center gap-3">
              <UserCheck className="h-12 w-12" />
              <p className="italic font-medium">Belum ada tamu aktif.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissions.map((perm: any) => (
                <div key={perm.id} className="flex items-center justify-between p-6 bg-white border border-emerald-100 rounded-[1.5rem]">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate max-w-[150px]">{perm.guestEmail}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Aktif</p>
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
