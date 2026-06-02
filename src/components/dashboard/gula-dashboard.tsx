
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
import { DexcomSync } from "./dexcom-sync";
import { ClarityImport } from "./clarity-import";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, History, Sparkles, FileSpreadsheet, Loader2, Users, ShieldAlert, Lock, UserPlus, Radio, FileText, Calendar } from "lucide-react";
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

type TimeFilter = '3h' | '6h' | '12h' | '24h' | '7d' | '14d' | 'all';

interface GulaDashboardProps {
  openRequestDialog?: () => void;
}

export function GulaDashboard({ openRequestDialog }: GulaDashboardProps) {
  const db = useFirestore();
  const { user } = useUser();
  const [minRange, setMinRange] = useState<number>(70);
  const [maxRange, setMaxRange] = useState<number>(140);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [viewingOwner, setViewingOwner] = useState<{uid: string, email: string} | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const userEmail = useMemo(() => user?.email?.toLowerCase() || "", [user]);
  const isAppOwner = useMemo(() => userEmail === APP_OWNER_EMAIL.toLowerCase(), [userEmail]);

  const sharedAccessQuery = useMemo(() => {
    if (!db || !userEmail) return null;
    return query(collection(db, "permissions"), where("guestEmail", "==", userEmail));
  }, [db, userEmail]);
  
  const { data: sharedPermissions, loading: loadingPerms } = useCollection(sharedAccessQuery);

  const currentUid = viewingOwner ? viewingOwner.uid : (isAppOwner ? user?.uid : null);

  const readingsQuery = useMemo(() => {
    if (!db || !currentUid) return null;
    return query(
      collection(db, "readings"), 
      where("userId", "==", currentUid),
      orderBy("timestamp", "desc"), 
      limit(100000)
    );
  }, [db, currentUid]);

  const { data: readingsData, loading: loadingReadings } = useCollection(readingsQuery);

  const allReadings = useMemo(() => {
    return (readingsData || []) as Reading[];
  }, [readingsData]);

  const filteredReadings = useMemo(() => {
    if (timeFilter === 'all') return allReadings;
    const now = new Date();
    let filterMs = 0;

    switch (timeFilter) {
      case '3h': filterMs = 3 * 60 * 60 * 1000; break;
      case '6h': filterMs = 6 * 60 * 60 * 1000; break;
      case '12h': filterMs = 12 * 60 * 60 * 1000; break;
      case '24h': filterMs = 24 * 60 * 60 * 1000; break;
      case '7d': filterMs = 7 * 24 * 60 * 60 * 1000; break;
      case '14d': filterMs = 14 * 24 * 60 * 60 * 1000; break;
    }

    const pastDate = new Date(now.getTime() - filterMs);
    return allReadings.filter(r => new Date(r.timestamp) >= pastDate);
  }, [allReadings, timeFilter]);

  const syncToGoogleSheets = async (value: number, timestamp: string) => {
    if (!APPS_SCRIPT_URL || !user?.email) return;

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ 
          value, 
          timestamp, 
          userEmail: user.email,
          timezone: "Europe/Berlin"
        }),
      });
    } catch (err) {
      console.warn("Sync to Sheets failed:", err);
    }
  };

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

    syncToGoogleSheets(value, timestamp);
    toast({ title: "Data Dicatat!", description: "Tersimpan di Cloud & Google Sheets." });
  };

  const handleImportedReadings = useCallback(async (imported: Reading[]) => {
    if (!db || !user || !isAppOwner || viewingOwner || isImporting) return;
    
    setIsImporting(true);
    
    // Normalisasi waktu ke UNIX untuk deteksi duplikat yang akurat
    const existingTimes = new Set(allReadings.map(r => new Date(r.timestamp).getTime()));
    const newItems = imported.filter(r => !existingTimes.has(new Date(r.timestamp).getTime()));
    
    if (newItems.length === 0) {
      toast({ title: "Data Sudah Lengkap", description: "Tidak ditemukan data baru untuk ditambahkan." });
      setIsImporting(false);
      return;
    }

    toast({ 
      title: "Memproses Impor", 
      description: `Sedang mengunggah ${newItems.length} data baru...` 
    });

    try {
      const batchSize = 400; 
      for (let i = 0; i < newItems.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = newItems.slice(i, i + batchSize);
        
        chunk.forEach(r => {
          const docRef = doc(collection(db, "readings"));
          batch.set(docRef, {
            value: r.value,
            timestamp: r.timestamp,
            userId: user.uid,
            createdAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Sinkronisasi Sheets hanya untuk data terbaru agar tidak overload
      const itemsToSync = newItems.slice(-300); 
      const syncInParallel = async (items: Reading[]) => {
        const parallelLimit = 5;
        for (let j = 0; j < items.length; j += parallelLimit) {
          const chunk = items.slice(j, j + parallelLimit);
          await Promise.all(chunk.map(item => syncToGoogleSheets(item.value, item.timestamp)));
        }
      };
      
      syncInParallel(itemsToSync).catch(e => console.error("Sheets sync error:", e));

      toast({ 
        title: "Impor Berhasil!", 
        description: `Berhasil menambahkan ${newItems.length} data ke riwayat.` 
      });
    } catch (err) {
      console.error("Import Error:", err);
      toast({ title: "Gagal Impor", description: "Terjadi kesalahan sistem saat menyimpan data.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  }, [db, user, isAppOwner, viewingOwner, allReadings, isImporting]);

  if (loadingPerms || loadingReadings) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Memuat data kesehatan...</p>
      </div>
    );
  }

  const isGuestWithNoAccess = !isAppOwner && !viewingOwner && (!sharedPermissions || sharedPermissions.length === 0);

  if (isGuestWithNoAccess && user) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-16 text-center space-y-8">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-12 w-12 text-amber-600" />
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-slate-900 leading-tight">Akses Terbatas</h2>
                <p className="text-slate-500 text-lg font-medium">
                  Hubungi pemilik data untuk mendapatkan izin pemantauan.
                </p>
              </div>
              <Button onClick={openRequestDialog} size="lg" className="rounded-2xl h-16 px-10 text-lg font-bold gap-3 shadow-xl">
                <UserPlus className="h-6 w-6" /> Minta Akses Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body animate-in fade-in duration-500">
      {((sharedPermissions && sharedPermissions.length > 0) || (isAppOwner && sharedPermissions && sharedPermissions.length > 0)) && (
        <div className="flex flex-wrap items-center gap-4 p-5 bg-white/80 backdrop-blur-sm border border-primary/10 rounded-[1.5rem] shadow-sm">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <ShieldAlert className="h-3 w-3" /> Akun Terhubung:
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
              <Users className="h-4 w-4" /> {perm.ownerEmail?.split('@')[0]}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={cn("space-y-8", (isAppOwner && !viewingOwner) ? "lg:col-span-8" : "lg:col-span-12")}>
          <MetricsGrid readings={allReadings} minRange={minRange} maxRange={maxRange} />
          
          <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
            <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between px-10 pt-10 gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-800">
                  <Activity className="h-6 w-6 text-primary" /> Visualisasi Tren
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  <Calendar className="h-3 w-3" /> Total: {allReadings.length} Data
                </div>
              </div>
              <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl gap-1">
                {(['3h', '6h', '12h', '24h', '7d', '14d', 'all'] as TimeFilter[]).map((filter) => (
                  <Button 
                    key={filter}
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setTimeFilter(filter)} 
                    className={cn(
                      "h-8 px-3 text-[10px] font-black rounded-xl transition-all", 
                      timeFilter === filter ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:bg-white/50"
                    )}
                  >
                    {filter.toUpperCase()}
                  </Button>
                ))}
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
                  <TabsTrigger value="dexcom" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest text-blue-600 data-[state=active]:bg-white">
                    <Radio className="h-4 w-4 mr-2" /> Dexcom Sync
                  </TabsTrigger>
                  <TabsTrigger value="clarity" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest text-emerald-600 data-[state=active]:bg-white">
                    <FileText className="h-4 w-4 mr-2" /> Clarity Import
                  </TabsTrigger>
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
                  <TabsContent value="dexcom">
                    <DexcomSync onSyncComplete={handleImportedReadings} isOwner={true} />
                  </TabsContent>
                  <TabsContent value="clarity">
                    <ClarityImport onImportComplete={handleImportedReadings} isOwner={true} />
                  </TabsContent>
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
                <CardTitle className="text-2xl font-black text-primary">Catat Manual</CardTitle>
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
