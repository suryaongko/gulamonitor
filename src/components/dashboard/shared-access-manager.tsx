
"use client";

import React, { useMemo } from "react";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, query, where, deleteDoc, doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck, UserPlus, Trash2, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";

export function SharedAccessManager() {
  const db = useFirestore();
  const { user } = useUser();
  
  const userEmail = useMemo(() => user?.email?.toLowerCase().trim() || "", [user]);
  const userUid = useMemo(() => user?.uid || "", [user]);

  // Kueri yang disederhanakan: Hanya berdasarkan ownerEmail.
  // Memfilter status 'pending' dilakukan di sisi klien untuk menghindari kebutuhan Composite Index Firestore.
  const requestsQuery = useMemo(() => {
    if (!db || !userEmail) return null;
    return query(
      collection(db, "requests"), 
      where("ownerEmail", "==", userEmail)
    );
  }, [db, userEmail]);

  const permissionsQuery = useMemo(() => {
    if (!db || !userUid) return null;
    return query(
      collection(db, "permissions"), 
      where("ownerUid", "==", userUid)
    );
  }, [db, userUid]);

  const { data: rawRequests, loading: loadingRequests } = useCollection(requestsQuery);
  const { data: permissions, loading: loadingPermissions } = useCollection(permissionsQuery);

  // Filter permintaan yang statusnya 'pending' secara lokal
  const requests = useMemo(() => {
    return (rawRequests || []).filter((req: any) => req.status === "pending");
  }, [rawRequests]);

  const approveRequest = (request: any) => {
    if (!db || !user || !userUid || !request?.requesterEmail) return;
    
    const permId = `${request.requesterEmail}_${userUid}`;
    const permissionsRef = doc(db, "permissions", permId);
    const requestsRef = doc(db, "requests", request.id);
    
    setDoc(permissionsRef, {
      ownerUid: userUid,
      ownerEmail: userEmail,
      guestEmail: request.requesterEmail,
      grantedAt: new Date().toISOString()
    }).catch(err => console.error("Permission grant failed", err));

    deleteDoc(requestsRef).catch(err => console.error("Request cleanup failed", err));

    toast({ 
      title: "Akses Disetujui", 
      description: `${request.requesterEmail} sekarang bisa memantau data Anda.` 
    });
  };

  const revokeAccess = (permId: string) => {
    if (!db) return;
    deleteDoc(doc(db, "permissions", permId))
      .then(() => toast({ title: "Akses Dicabut" }))
      .catch(() => toast({ title: "Gagal Mencabut Akses", variant: "destructive" }));
  };

  const ignoreRequest = (requestId: string) => {
    if (!db) return;
    deleteDoc(doc(db, "requests", requestId))
      .then(() => toast({ title: "Permintaan Dihapus" }))
      .catch(() => toast({ title: "Gagal Menghapus", variant: "destructive" }));
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
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Memuat daftar izin...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b px-8 py-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-800">
            <UserPlus className="h-6 w-6 text-primary" /> Permintaan Akses Masuk
          </CardTitle>
          <CardDescription>Orang-orang berikut ingin memantau data kesehatan Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {(!requests || requests.length === 0) ? (
            <div className="text-center py-12 opacity-30 flex flex-col items-center gap-3">
              <Mail className="h-12 w-12" />
              <p className="italic font-medium">Tidak ada permintaan tertunda.</p>
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
                      <p className="font-bold text-slate-800 truncate max-w-[200px]">{req.requesterEmail || "User"}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {safeFormatDate(req.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => approveRequest(req)} className="rounded-xl h-10 px-8 font-bold shadow-md shadow-primary/20">
                      Setujui
                    </Button>
                    <Button variant="ghost" onClick={() => ignoreRequest(req.id)} className="rounded-xl h-10 px-4 text-red-400 hover:text-red-500 hover:bg-red-50">
                      Hapus
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
            <UserCheck className="h-6 w-6 text-emerald-600" /> Tamu yang Memantau
          </CardTitle>
          <CardDescription className="text-emerald-700/70">Orang-orang ini memiliki izin aktif untuk melihat dashboard Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {(!permissions || permissions.length === 0) ? (
            <div className="text-center py-12 opacity-30 flex flex-col items-center gap-3">
              <UserCheck className="h-12 w-12" />
              <p className="italic font-medium">Belum ada tamu yang Anda setujui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissions.map((perm: any) => (
                <div key={perm.id} className="flex items-center justify-between p-6 bg-white border border-emerald-100 rounded-[1.5rem] transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate max-w-[150px]">{perm.guestEmail || "Guest"}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Akses Aktif</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => revokeAccess(perm.id)} className="rounded-xl w-10 h-10 text-slate-300 hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="h-5 w-5" />
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
