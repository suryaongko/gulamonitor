
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
import { Activity, History, Settings, Sparkles, FileSpreadsheet, Loader2, Users, ArrowLeft, ShieldAlert, Lock } from "lucide-react";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, where, writeBatch, doc } from "firebase/firestore";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface Reading {
  id: string;
  value: number;
  timestamp: string;
  userId?: string;
}

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYQ9YMryTvSkYuSAgzz2WevurAZ47gHVwVfXfh5U0Y_lSk5A9ecG2_GdSO15tV-k0E/exec";
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGaOFv2lMN-vaZOXMzqGsit1PASt_vyU46mnY3hVpaOLKZMZ8bBSxDHzlMVmjB_P_rZM21dMM2LJLW/pub?gid=0&single=true&output=csv";
const APP_OWNER_EMAIL = "surya.ongko@gmail.com";

export function GulaDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const [minRange, setMinRange] = useState<number>(70);
  const [maxRange, setMaxRange] = useState<number>(140);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h'>('all');
  const [viewingOwner, setViewingOwner] = useState<{uid: string, email: string} | null>(null);

  const userEmail = user?.email?.toLowerCase() || "";
  const isAppOwner = useMemo(() => userEmail === APP_OWNER_EMAIL.toLowerCase(), [userEmail]);

  // Query permissions for guests
  const sharedAccessQuery = useMemo(() => {
    if (!db || !userEmail) return null;
    return query(collection(db, "permissions"), where("guestEmail", "==", userEmail));
  }, [db, userEmail]);
  
  const { data: sharedPermissions } = useCollection(sharedAccessQuery);

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

  const { data: readingsData, loading } = useCollection(readingsQuery);

  const allReadings = useMemo(() => {
    if (!readingsData) return [];
    return readingsData.map(doc => ({
      id: doc.id,
      value: doc.value,
      timestamp: doc.timestamp,
      userId: doc.userId
    })) as Reading[];
  }, [readingsData]);

  const filteredReadings = useMemo(() => {
    if (timeFilter === 'all') return allReadings;
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return allReadings.filter(r => new Date(r.timestamp) >= past24h);
  }, [allReadings, timeFilter]);

  const addReading = async (value: number, timestamp: string) => {
    if (!db || !user || !isAppOwner || viewingOwner) return; 
    
    try {
      addDoc(collection(db, "readings"), {
        value,
        timestamp,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      if (APPS_SCRIPT_URL) {
        fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ value, timestamp, userEmail: user.email }),
        }).catch(err => console.warn("Sync Warning:", err));
      }

      toast({ title: "Data Dicatat!", description: "Tersimpan di Cloud & Google Sheets." });
    } catch (error) {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    }
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

    try {
      await batch.commit();
      toast({ title: "Auto-Sync Berhasil", description: `${newItems.length} data baru ditarik.` });
    } catch (error) {
      console.error("Batch sync error:", error);
    }
  }, [db, user, isAppOwner, viewingOwner, allReadings]);

  // Sinkronisasi otomatis di latar belakang saat owner login
  useEffect(() => {
    if (isAppOwner && !viewingOwner && GOOGLE_SHEETS_CSV_URL) {
      const triggerAutoSync = async () => {
        try {
          const response = await fetch(GOOGLE_SHEETS_CSV_URL);
          const csvText = await response.text();
          const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
          if (rows.length <= 1) return;

          const importedReadings: Reading[] = rows.slice(1).map(row => {
            const columns = row.includes(";") ? row.split(";") : row.split(",");
            const val = parseFloat(columns[1]?.replace(",", ".") || "0");
            const date = new Date(columns[0]);
            if (isNaN(val) || isNaN(date.getTime())) return null;
            return { id: date.getTime().toString(), value: val, timestamp: date.toISOString() };
          }).filter((r): r is Reading => r !== null);

          handleImportedReadings(importedReadings);
        } catch (e) {
          console.warn("Background sync failed silently", e);
        }
      };
      triggerAutoSync();
    }
  }, [isAppOwner, viewingOwner, handleImportedReadings]);

  if (loading && allReadings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Menghubungkan layanan...</p>
      </div>
    );
  }

  const isGuestWithNoAccess = !isAppOwner && !viewingOwner && (!sharedPermissions || sharedPermissions.length === 0);

  if (isGuestWithNoAccess && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-6">
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-16 text-center space-y-8">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
              <Lock className="h-12 w-12 text-amber-600" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-slate-900">Akses Terbatas</h2>
              <p className="text-slate-500 text-lg font-medium">
                Akun Anda belum memiliki izin untuk melihat data milik owner.
              </p>
            </div>
            <div className="p-8 bg-slate-50 rounded-[2rem] text-left border border-slate-100 space-y-4">
              <h3 className="font-black flex items-center gap-3 text-primary uppercase text-sm tracking-widest">
                <Users className="h-5 w-5" /> Instruksi Akses:
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <p className="text-slate-600 font-medium leading-relaxed">Gunakan tombol <strong>"Minta Akses"</strong> di bagian header.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <p className="text-slate-600 font-medium leading-relaxed">Masukkan email pemilik: <strong>{APP_OWNER_EMAIL}</strong>.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <p className="text-slate-600 font-medium leading-relaxed">Pemilik akan menyetujui permintaan Anda melalui dashboard mereka.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body">
      {(sharedPermissions && sharedPermissions.length > 0) && (
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
          {sharedPermissions.map((perm: any) => (
            <Button 
              key={perm.id}
              variant={viewingOwner?.uid === perm.ownerUid ? "default" : "outline"} 
              size="sm" 
              onClick={() => setViewingOwner({uid: perm.ownerUid, email: perm.ownerEmail})}
              className="rounded-xl h-10 px-6 gap-2 font-bold transition-all"
            >
              <Users className="h-4 w-4" /> {perm.ownerEmail.split('@')[0]}
            </Button>
          ))}
        </div>
      )}

      {viewingOwner && (
        <div className="bg-primary text-white p-6 rounded-[2rem] flex items-center justify-between shadow-2xl shadow-primary/20 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="font-black text-lg">Mode Pemantauan Aktif</p>
              <p className="text-sm opacity-90 font-medium">Melihat riwayat: {viewingOwner.email}</p>
            </div>
          </div>
          {isAppOwner && (
            <Button variant="secondary" size="sm" onClick={() => setViewingOwner(null)} className="rounded-xl h-10 px-6 gap-2 font-bold">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Data Saya
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={cn("space-y-8 transition-all duration-500", (isAppOwner && !viewingOwner) ? "lg:col-span-8" : "lg:col-span-12")}>
          <MetricsGrid readings={allReadings} minRange={minRange} maxRange={maxRange} />
          
          <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 px-10 pt-10">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-800">
                  <Activity className="h-6 w-6 text-primary" /> Visualisasi Tren
                </CardTitle>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Gula Darah</p>
              </div>
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTimeFilter('24h')} 
                  className={cn("h-9 px-6 text-xs font-black rounded-xl", timeFilter === '24h' ? "bg-white text-primary shadow-sm" : "text-slate-500")}
                >
                  24 JAM
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTimeFilter('all')} 
                  className={cn("h-9 px-6 text-xs font-black rounded-xl", timeFilter === 'all' ? "bg-white text-primary shadow-sm" : "text-slate-500")}
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
              <TabsTrigger value="readings" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest">
                <History className="h-4 w-4 mr-2" /> Riwayat
              </TabsTrigger>
              <TabsTrigger value="ai" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest">
                <Sparkles className="h-4 w-4 mr-2 text-primary" /> Analisis AI
              </TabsTrigger>
              {isAppOwner && !viewingOwner && (
                <>
                  <TabsTrigger value="sharing" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest">
                    <Users className="h-4 w-4 mr-2" /> Izin Akses
                  </TabsTrigger>
                  <TabsTrigger value="sync" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest">
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
