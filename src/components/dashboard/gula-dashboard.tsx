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
import { Activity, History, Settings, Sparkles, FileSpreadsheet, Loader2, Users, ArrowLeft, ShieldAlert } from "lucide-react";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, where } from "firebase/firestore";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface Reading {
  id: string;
  value: number;
  timestamp: string;
  userId?: string;
}

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzp3u7CYidcQ54ILprqUhvG6SdUijycxcYM9AUxcAPsU-7XYEqXOIaeg2VJwCM6PCTg/exec";
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGaOFv2lMN-vaZOXMzqGsit1PASt_vyU46mnY3hVpaOLKZMZ8bBSxDHzlMVmjB_P_rZM21dMM2LJLW/pub?gid=0&single=true&output=csv";

export function GulaDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const [minRange, setMinRange] = useState<number>(70);
  const [maxRange, setMaxRange] = useState<number>(140);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h'>('all');
  const [viewingOwner, setViewingOwner] = useState<{uid: string, email: string} | null>(null);

  // Ambil daftar izin yang saya miliki sebagai TAMU
  const sharedAccessQuery = useMemo(() => {
    if (!db || !user?.email) return null;
    return query(collection(db, "permissions"), where("guestEmail", "==", user.email));
  }, [db, user]);
  
  const { data: sharedPermissions } = useCollection(sharedAccessQuery);

  // Tentukan UID data mana yang akan ditampilkan (Milik sendiri atau milik orang lain)
  const currentUid = viewingOwner ? viewingOwner.uid : user?.uid;

  // Load readings berdasarkan UID terpilih
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
    if (!db || !user || viewingOwner) return; 
    
    try {
      await addDoc(collection(db, "readings"), {
        value,
        timestamp,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      // Sync ke Apps Script (Hanya jika data milik sendiri)
      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, timestamp, userEmail: user.email }),
      }).catch(err => console.error("Apps Script Error:", err));

      toast({ 
        title: "Data Disimpan", 
        description: "Nilai gula darah berhasil dicatat." 
      });
    } catch (error) {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    }
  };

  // Auto-sync dari Google Sheets (Hanya untuk data sendiri)
  const handleAutoSyncFromSheets = useCallback(async () => {
    if (!user || !db || viewingOwner) return;
    try {
      const response = await fetch(GOOGLE_SHEETS_CSV_URL);
      if (!response.ok) return;
      // Sinkronisasi otomatis di latar belakang sudah diatur oleh komponen GoogleSheetsSync
    } catch (error) {
      console.error("Auto-sync background task failed");
    }
  }, [user, db, viewingOwner]);

  useEffect(() => {
    if (user && db && !loading && !viewingOwner) {
      handleAutoSyncFromSheets();
    }
  }, [user, db, loading, handleAutoSyncFromSheets, viewingOwner]);

  if (loading && allReadings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Mengambil data kesehatan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Switcher Akses Bersama */}
      {sharedPermissions && sharedPermissions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-primary/10 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Lihat Data:</span>
          <Button 
            variant={!viewingOwner ? "default" : "outline"} 
            size="sm" 
            onClick={() => setViewingOwner(null)}
            className="rounded-xl h-9 px-4 font-semibold"
          >
            Saya
          </Button>
          {sharedPermissions.map((perm: any) => (
            <Button 
              key={perm.id}
              variant={viewingOwner?.uid === perm.ownerUid ? "default" : "outline"} 
              size="sm" 
              onClick={() => setViewingOwner({uid: perm.ownerUid, email: perm.ownerEmail})}
              className="rounded-xl h-9 px-4 gap-2 font-semibold"
            >
              <Users className="h-4 w-4" /> {perm.ownerEmail.split('@')[0]}
            </Button>
          ))}
        </div>
      )}

      {viewingOwner && (
        <div className="bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">Mode Pemantauan</p>
              <p className="text-sm opacity-90">Melihat data {viewingOwner.email} (Lihat Saja)</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setViewingOwner(null)} className="rounded-xl h-9 px-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Data Saya
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <MetricsGrid readings={allReadings} minRange={minRange} maxRange={maxRange} />
          
          <Card className="border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-md rounded-3xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 px-8 pt-8">
              <CardTitle className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                <Activity className="h-6 w-6 text-primary" />
                Tren Glukosa
              </CardTitle>
              <div className="flex items-center bg-slate-100 p-1.5 rounded-xl">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTimeFilter('24h')} 
                  className={cn("h-8 px-4 text-xs font-bold rounded-lg transition-all", timeFilter === '24h' ? "bg-white text-primary shadow-sm" : "text-slate-500")}
                >
                  24 JAM
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTimeFilter('all')} 
                  className={cn("h-8 px-4 text-xs font-bold rounded-lg transition-all", timeFilter === 'all' ? "bg-white text-primary shadow-sm" : "text-slate-500")}
                >
                  SEMUA
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <BloodSugarChart readings={filteredReadings} minRange={minRange} maxRange={maxRange} />
            </CardContent>
          </Card>

          <Tabs defaultValue="readings" className="w-full">
            <TabsList className="bg-slate-100 border-none p-1.5 rounded-2xl h-auto flex-wrap gap-1">
              <TabsTrigger value="readings" className="flex items-center gap-2 rounded-xl py-2 px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
                <History className="h-4 w-4" /> Riwayat
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2 rounded-xl py-2 px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
                <Sparkles className="h-4 w-4" /> Analisis AI
              </TabsTrigger>
              {!viewingOwner && (
                <>
                  <TabsTrigger value="sharing" className="flex items-center gap-2 rounded-xl py-2 px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
                    <Users className="h-4 w-4" /> Bagikan
                  </TabsTrigger>
                  <TabsTrigger value="sync" className="flex items-center gap-2 rounded-xl py-2 px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
                    <FileSpreadsheet className="h-4 w-4" /> Google Sheets
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="readings" className="mt-6">
              <ReadingsList readings={allReadings} />
            </TabsContent>
            
            <TabsContent value="ai" className="mt-6">
              <AIInsightsCard readings={allReadings} minRange={minRange} maxRange={maxRange} />
            </TabsContent>

            {!viewingOwner && (
              <>
                <TabsContent value="sharing" className="mt-6">
                  <SharedAccessManager />
                </TabsContent>
                <TabsContent value="sync" className="mt-6">
                  <GoogleSheetsSync onImport={handleAutoSyncFromSheets} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        {!viewingOwner && (
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-none shadow-xl bg-white/90 rounded-3xl p-2">
              <CardHeader className="px-6 pt-6"><CardTitle className="text-xl font-bold flex items-center gap-3 text-primary"><Activity className="h-6 w-6" /> Catat Baru</CardTitle></CardHeader>
              <CardContent className="px-6 pb-6"><ReadingForm onAdd={addReading} /></CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white/90 rounded-3xl p-2">
              <CardHeader className="px-6 pt-6"><CardTitle className="text-xl font-bold flex items-center gap-3 text-primary"><Settings className="h-6 w-6" /> Target Sehat</CardTitle></CardHeader>
              <CardContent className="px-6 pb-6"><RangeSettings minRange={minRange} maxRange={maxRange} onSave={(min, max) => { setMinRange(min); setMaxRange(max); }} /></CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
