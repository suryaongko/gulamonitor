
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ReadingForm } from "./reading-form";
import { RangeSettings } from "./range-settings";
import { MetricsGrid } from "./metrics-grid";
import { ReadingsList } from "./readings-list";
import { AIInsightsCard } from "./ai-insights-card";
import { BloodSugarChart } from "./blood-sugar-chart";
import { GoogleSheetsSync } from "./google-sheets-sync";
import { SharedAccessManager } from "./shared-access-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, History, Sparkles, FileSpreadsheet, Loader2, Users, ShieldAlert, Lock } from "lucide-react";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, where, writeBatch, doc } from "firebase/firestore";
import { useFirestore, useCollection, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface Reading {
  id: string;
  value: number;
  timestamp: string;
  userId?: string;
}

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmNWxysmsd30pOSPhRRdnuj5Lz8kags9UHVQxV7-i0A4OpNOcYagGaUQMpbzdW6gny/exec";
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGaOFv2lMN-vaZOXMzqGsit1PASt_vyU46mnY3hVpaOLKZMZ8bBSxDHzlMVmjB_P_rZM21dMM2LJLW/pub?gid=0&single=true&output=csv";
const APP_OWNER_EMAIL = "surya.ongko@gmail.com";

export function GulaDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const [minRange, setMinRange] = useState<number>(70);
  const [maxRange, setMaxRange] = useState<number>(140);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h'>('all');
  const [viewingOwner, setViewingOwner] = useState<{uid: string, email: string} | null>(null);

  const userEmail = useMemo(() => user?.email?.toLowerCase() || "", [user]);
  const isAppOwner = useMemo(() => userEmail === APP_OWNER_EMAIL.toLowerCase(), [userEmail]);

  // Query izin yang diberikan KE SAYA (untuk tamu melihat data orang lain)
  const sharedAccessQuery = useMemo(() => {
    if (!db || !userEmail) return null;
    return query(collection(db, "permissions"), where("guestEmail", "==", userEmail));
  }, [db, userEmail]);
  
  const { data: sharedPermissions, loading: loadingPerms } = useCollection(sharedAccessQuery);

  // UID data yang sedang dilihat
  const currentUid = viewingOwner ? viewingOwner.uid : (isAppOwner ? user?.uid : null);

  const readingsQuery = useMemo(() => {
    if (!db || !currentUid) return null;
    return query(
      collection(db, "readings"), 
      where("userId", "==", currentUid),
      orderBy("timestamp", "desc"), 
      limit(500)
    );
  }, [db, currentUid]);

  const { data: readingsData, loading: loadingReadings } = useCollection(readingsQuery);

  const allReadings = useMemo(() => {
    return (readingsData || []) as Reading[];
  }, [readingsData]);

  const filteredReadings = useMemo(() => {
    if (timeFilter === 'all') return allReadings;
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return allReadings.filter(r => new Date(r.timestamp) >= past24h);
  }, [allReadings, timeFilter]);

  const addReading = async (value: number, timestamp: string) => {
    if (!db || !user || !isAppOwner || viewingOwner) return; 
    
    const payload = {
      value,
      timestamp,
      userId: user.uid,
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "readings"), payload)
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'readings',
          operation: 'create',
          requestResourceData: payload
        }));
      });

    if (APPS_SCRIPT_URL) {
      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ 
          value, 
          timestamp, 
          userEmail: user.email,
          timezone: "Europe/Berlin"
        }),
      }).catch(err => console.warn("Sync Warning:", err));
    }

    toast({ title: "Data Dicatat!", description: "Tersimpan di Cloud & Google Sheets (Berlin)." });
  };

  const handleImportedReadings = useCallback(async (imported: Reading[]) => {
    if (!db || !user || !isAppOwner || viewingOwner) return;
    
    const existingTimestamps = new Set(allReadings.map(r => r.timestamp));
    const newItems = imported.filter(r => !existingTimestamps.has(r.timestamp));
    
    if (newItems.length === 0) return;

    const batch = writeBatch(db);
    newItems.forEach(r => {
      const docRef = doc(collection(db, "readings"));
      batch.set(docRef, {
        value: r.value,
        timestamp: r.timestamp,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
    });

    batch.commit().then(() => {
      toast({ title: "Sync Berhasil", description: `${newItems.length} data baru ditarik.` });
    }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'readings',
        operation: 'write'
      }));
    });
  }, [db, user, isAppOwner, viewingOwner, allReadings]);

  useEffect(() => {
    if (!isAppOwner || viewingOwner || !GOOGLE_SHEETS_CSV_URL) return;

    const triggerAutoSync = async () => {
      try {
        const response = await fetch(`${GOOGLE_SHEETS_CSV_URL}&t=${Date.now()}`);
        const csvText = await response.text();
        const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
        if (rows.length <= 1) return;

        const importedReadings: Reading[] = rows.slice(1).map(row => {
          const columns = row.includes(";") ? row.split(";") : row.split(",");
          const val = parseFloat(columns[1]?.replace(",", ".") || "0");
          const timestampStr = columns[0]?.trim();
          if (isNaN(val) || !timestampStr) return null;
          
          let dateObj: Date;
          if (timestampStr.includes('/')) {
            const parts = timestampStr.split(/[\/\-\s:]/);
            const d = parseInt(parts[0]);
            const m = parseInt(parts[1]) - 1;
            const y = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
            const h = parseInt(parts[3] || "0");
            const min = parseInt(parts[4] || "0");
            const s = parseInt(parts[5] || "0");
            dateObj = new Date(y, m, d, h, min, s);
          } else {
            dateObj = new Date(timestampStr);
          }

          if (isNaN(dateObj.getTime())) return null;
          return { id: dateObj.getTime().toString(), value: val, timestamp: dateObj.toISOString() };
        }).filter((r): r is Reading => r !== null);

        handleImportedReadings(importedReadings);
      } catch (e) {
        console.warn("Background sync failed", e);
      }
    };

    triggerAutoSync();
    const interval = setInterval(triggerAutoSync, 30000);
    return () => clearInterval(interval);
  }, [isAppOwner, viewingOwner, handleImportedReadings]);

  if ((loadingPerms || loadingReadings) && allReadings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Menghubungkan layanan...</p>
      </div>
    );
  }

  // Cek apakah tamu tapi belum punya izin sama sekali
  const isGuestWithNoAccess = !isAppOwner && !viewingOwner && (!sharedPermissions || sharedPermissions.length === 0);

  if (isGuestWithNoAccess && !loadingPerms) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-16 text-center space-y-8">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-12 w-12 text-amber-600" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-slate-900 leading-tight">Akses Terbatas</h2>
              <p className="text-slate-500 text-lg font-medium">
                Akun Anda ({user?.email}) belum memiliki izin untuk memantau data. Silakan hubungi pemilik data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body animate-in fade-in duration-500">
      {/* Access Switcher Bar */}
      {((sharedPermissions && sharedPermissions.length > 0) || (isAppOwner && sharedPermissions && sharedPermissions.length > 0)) && (
        <div className="flex flex-wrap items-center gap-4 p-5 bg-white/80 backdrop-blur-sm border border-primary/10 rounded-[1.5rem] shadow-sm">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <ShieldAlert className="h-3 w-3" /> Sumber Data:
          </span>
          {isAppOwner && (
            <Button 
              variant={!viewingOwner ? "default" : "outline"} 
              size="sm" 
              onClick={() => setViewingOwner(null)}
              className="rounded-xl h-10 px-6 font-bold"
            >
              Data Saya
            </Button>
          )}
          {sharedPermissions?.map((perm: any) => (
            <Button 
              key={perm.id}
              variant={viewingOwner?.uid === perm.ownerUid ? "default" : "outline"} 
              size="sm" 
              onClick={() => setViewingOwner({uid: perm.ownerUid, email: perm.ownerEmail})}
              className="rounded-xl h-10 px-6 gap-2 font-bold"
            >
              <Users className="h-4 w-4" /> {perm.ownerEmail?.split('@')[0] || 'Owner'}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={cn("space-y-8", (isAppOwner && !viewingOwner) ? "lg:col-span-8" : "lg:col-span-12")}>
          <MetricsGrid readings={allReadings} minRange={minRange} maxRange={maxRange} />
          
          <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between px-10 pt-10">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-800">
                  <Activity className="h-6 w-6 text-primary" /> Visualisasi Tren
                </CardTitle>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Waktu Berlin (GMT+1)</p>
              </div>
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTimeFilter('24h')} 
                  className={cn("h-9 px-6 text-xs font-black rounded-xl transition-all", timeFilter === '24h' ? "bg-white text-primary shadow-sm" : "text-slate-500")}
                >
                  24 JAM
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTimeFilter('all')} 
                  className={cn("h-9 px-6 text-xs font-black rounded-xl transition-all", timeFilter === 'all' ? "bg-white text-primary shadow-sm" : "text-slate-500")}
                >
                  SEMUA
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-10 min-h-[450px]">
              <BloodSugarChart readings={filteredReadings} minRange={minRange} maxRange={maxRange} />
            </CardContent>
          </Card>

          <Tabs defaultValue="readings" className="w-full">
            <TabsList className="bg-slate-100/50 p-1.5 rounded-[1.8rem] h-auto flex-wrap gap-1.5">
              <TabsTrigger value="readings" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white">
                <History className="h-4 w-4 mr-2" /> Riwayat
              </TabsTrigger>
              <TabsTrigger value="ai" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest text-primary data-[state=active]:bg-white">
                <Sparkles className="h-4 w-4 mr-2" /> Analisis AI
              </TabsTrigger>
              {isAppOwner && !viewingOwner && (
                <>
                  <TabsTrigger value="sharing" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white">
                    <Users className="h-4 w-4 mr-2" /> Izin Akses
                  </TabsTrigger>
                  <TabsTrigger value="sync" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white">
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Google Sheets
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            <div className="mt-8">
              <TabsContent value="readings">
                <ReadingsList readings={allReadings} />
              </TabsContent>
              <TabsContent value="ai">
                <AIInsightsCard readings={allReadings} minRange={minRange} maxRange={maxRange} />
              </TabsContent>
              {isAppOwner && !viewingOwner && (
                <>
                  <TabsContent value="sharing">
                    <SharedAccessManager />
                  </TabsContent>
                  <TabsContent value="sync">
                    <GoogleSheetsSync 
                      onImport={handleImportedReadings} 
                      defaultUrl={GOOGLE_SHEETS_CSV_URL}
                      autoSync={true} 
                    />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>

        {isAppOwner && !viewingOwner && (
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem]">
              <CardHeader className="px-10 pt-10 pb-4">
                <CardTitle className="text-2xl font-black text-primary">Catat Baru</CardTitle>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <ReadingForm onAdd={addReading} />
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem]">
              <CardHeader className="px-10 pt-10 pb-4">
                <CardTitle className="text-2xl font-black text-primary">Target Sehat</CardTitle>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <RangeSettings 
                  minRange={minRange} 
                  maxRange={maxRange} 
                  onSave={(min, max) => { setMinRange(min); setMaxRange(max); }} 
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
