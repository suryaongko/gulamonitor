
"use client";

import React, { useMemo } from "react";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, query, where, addDoc, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, UserPlus, Trash2, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function SharedAccessManager() {
  const db = useFirestore();
  const { user } = useUser();

  // Get requests sent TO me
  const requestsQuery = useMemo(() => {
    if (!db || !user?.email) return null;
    return query(collection(db, "requests"), where("ownerEmail", "==", user.email), where("status", "==", "pending"));
  }, [db, user]);

  // Get permissions I have granted
  const permissionsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "permissions"), where("ownerUid", "==", user.uid));
  }, [db, user]);

  const { data: requests, loading: loadingRequests } = useCollection(requestsQuery);
  const { data: permissions, loading: loadingPermissions } = useCollection(permissionsQuery);

  const approveRequest = async (request: any) => {
    if (!db || !user) return;
    try {
      // 1. Create permission
      const permId = `${request.requesterEmail}_${user.uid}`;
      await setDoc(doc(db, "permissions", permId), {
        ownerUid: user.uid,
        ownerEmail: user.email,
        guestEmail: request.requesterEmail,
        grantedAt: new Date().toISOString()
      });

      // 2. Mark request as approved
      await deleteDoc(doc(db, "requests", request.id));
      
      toast({ title: "Akses Disetujui", description: `${request.requesterEmail} sekarang bisa melihat data Anda.` });
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
      toast({ title: "Gagal mencabut akses", variant: "destructive" });
    }
  };

  if (loadingRequests || loadingPermissions) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md bg-white/80">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Permintaan Akses Masuk
          </CardTitle>
          <CardDescription>Orang-orang berikut ingin memantau gula darah Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests?.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Tidak ada permintaan pending.</p>
          ) : (
            <div className="space-y-3">
              {requests?.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{req.requesterEmail}</span>
                  </div>
                  <Button size="sm" onClick={() => approveRequest(req)} className="rounded-lg gap-2">
                    <UserCheck className="h-4 w-4" /> Setujui
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-white/80">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Akses yang Diberikan
          </CardTitle>
          <CardDescription>Daftar tamu yang saat ini bisa melihat data Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {permissions?.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Anda belum membagikan data ke siapapun.</p>
          ) : (
            <div className="space-y-3">
              {permissions?.map((perm: any) => (
                <div key={perm.id} className="flex items-center justify-between p-3 bg-white border rounded-xl">
                  <span className="text-sm font-medium">{perm.guestEmail}</span>
                  <Button variant="ghost" size="sm" onClick={() => revokeAccess(perm.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
