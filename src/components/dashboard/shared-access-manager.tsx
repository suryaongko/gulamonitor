
"use client";

import React, { useMemo } from "react";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, query, where, deleteDoc, doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck, UserPlus, Trash2, Mail, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function SharedAccessManager() {
  const db = useFirestore();
  const { user } = useUser();
  const userEmail = useMemo(() => user?.email?.toLowerCase() || "", [user]);

  // Permintaan ke SAYA
  const requestsQuery = useMemo(() => {
    if (!db || !userEmail) return null;
    return query(collection(db, "requests"), where("ownerEmail", "==", userEmail), where("status", "==", "pending"));
  }, [db, userEmail]);

  // Izin yang SAYA berikan
  const permissionsQuery = useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "permissions"), where("ownerUid", "==", user.uid));
  }, [db, user]);

  const { data: requests, loading: loadingRequests } = useCollection(requestsQuery);
  const { data: permissions, loading: loadingPermissions } = useCollection(permissionsQuery);

  const approveRequest = async (request: any) => {
    if (!db || !user) return;
    try {
      const permId = `${request.requesterEmail}_${user.uid}`;
      await setDoc(doc(db, "permissions", permId), {
        ownerUid: user.uid,
        ownerEmail: userEmail,
        guestEmail: request.requesterEmail,
        grantedAt: new Date().toISOString()
      });
      await deleteDoc(doc(db, "requests", request.id));
      toast({ title: "Akses Disetujui", description: `${request.requesterEmail} sekarang bisa memantau.` });
    } catch (error) {
      toast({ title: "Gagal menyetujui", variant: "destructive" });
    }
  };

  const revokeAccess = async (permId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "permissions", permId));
      toast({ title: "Akses Dicabut" });
    } catch (error) {
      toast({ title: "Gagal mencabut", variant: "destructive" });
    }
  };

  const ignoreRequest = async (requestId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "requests", requestId));
      toast({ title: "Permintaan Dihapus" });
    } catch (error) {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  if (loadingRequests || loadingPermissions) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b px-8 py-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-primary" /> Permintaan Akses Masuk
          </CardTitle>
          <CardDescription>Tinjau orang yang ingin memantau data Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {!requests || requests.length === 0 ? (
            <div className="text-center py-10 opacity-40">
              <Mail className="h-10 w-10 mx-auto mb-3" />
              <p className="italic">Tidak ada permintaan tertunda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req: any) => (
                <div key={req.id} className="flex flex-col sm:flex-row items-center justify-between p-5 bg-slate-50 border rounded-2xl gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold">{req.requesterEmail}</p>
                      <p className="text-xs text-slate-500">
                        {req.timestamp ? format(new Date(req.timestamp), "d MMM, HH:mm") : "Baru saja"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approveRequest(req)} className="rounded-xl h-10 px-6 font-bold shadow-lg">
                      Setujui
                    </Button>
                    <Button variant="ghost" onClick={() => ignoreRequest(req.id)} className="rounded-xl text-red-500">
                      Abaikan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-emerald-50/50 border-b px-8 py-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-emerald-800">
            <UserCheck className="h-6 w-6 text-emerald-600" /> Daftar Akses Aktif
          </CardTitle>
          <CardDescription className="text-emerald-700">Tamu yang bisa memantau data Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {!permissions || permissions.length === 0 ? (
            <div className="text-center py-10 opacity-40">
              <Users className="h-10 w-10 mx-auto mb-3" />
              <p className="italic">Belum ada tamu yang disetujui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissions.map((perm: any) => (
                <div key={perm.id} className="flex items-center justify-between p-5 bg-white border border-emerald-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold">{perm.guestEmail}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Aktif</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => revokeAccess(perm.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
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
