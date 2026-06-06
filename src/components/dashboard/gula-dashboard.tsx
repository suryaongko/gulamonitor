"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ReadingForm } from "./reading-form";
import { RangeSettings } from "./range-settings";
import { MetricsGrid } from "./metrics-grid";
import { ReadingsList } from "./readings-list";
import { AIInsightsCard } from "./ai-insights-card";
import { BloodSugarChart } from "./blood-sugar-chart";
import { GoogleSheetsSync } from "./google-sheets-sync";
import { SharedAccessManager } from "./shared-access-manager";
import { DexcomSync } from "./dexcom-sync";
import { LibreSync } from "./libre-sync";
import { ClarityImport } from "./clarity-import";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, History, Sparkles, FileSpreadsheet, Loader2, Users, Lock, UserPlus, Radio, FileText, Calendar, Database, Smartphone } from "lucide-react";
import { collection, serverTimestamp, query, orderBy, limit, where, writeBatch, doc } from "firebase/firestore";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface Reading {
  id: string;
  value: number;
  timestamp: string;
  userId?: string;
  source?: string;
}

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmNWxysmsd30pOSPhRRdnuj5Lz8kags9UHVQxV7-i0A4OpNOcYagGaUQMpbzdW6gny/exec";
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGaOFv2lMN-vaZOXMzqGsit1PASt_vyU46mnY3hVpaOLKZMZ8bBSxDHzlMVmjB_P_rZM21dMM2LJLW/pub?gid=0&single=true&output=csv";

type TimeFilter = '3h' | '6h' | '12h' | '24h' | '7d' | '14d' | 'all';

interface GulaDashboardProps {
  openRequestDialog?: () => void;
}

export function GulaDashboard({ openRequestDialog }: GulaDashboardProps) {
  const db = useFirestore();
  const { user } = useUser();
  const [minRange, setMinRange] = useState<number>(70);
  const [maxRange, setMaxRange] = useState<number>(140);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [viewingOwner, setViewingOwner] = useState<{uid: string, email: string} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const userEmail = useMemo(() => user?.email?.toLowerCase() || "", [user]);
  
  const sharedAccessQuery = useMemo(() => {
    if (!db || !userEmail) return null;
    return query(collection(db, "permissions"), where("guestEmail", "==", userEmail));
  }, [db, userEmail]);
  
  const { data: sharedPermissions, loading: loadingPerms } = useCollection(sharedAccessQuery);

  const currentUid = useMemo(() => {
    if (viewingOwner) return viewingOwner.uid;
    return user?.uid || null;
  }, [viewingOwner, user]);

  const readingsQuery = useMemo(() => {
    if (!db || !currentUid) return null;
    return query(
      collection(db, "readings"), 
      where("userId", "==", currentUid),
      orderBy("timestamp", "desc"), 
      limit(50000)
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

  const handleIngestData = useCallback(async (incoming: Reading[], sourceLabel: string) => {
    if (!db || !user || viewingOwner || isSyncing || loadingReadings) return;
    
    setIsSyncing(true);
    
    const existingMap = new Map<string, boolean>();
    allReadings.forEach(r => {
      const key = `${new Date(r.timestamp).getTime()}-${r.value}`;
      existingMap.set(key, true);
    });

    const newItems = incoming.filter(r => {
      const timeKey = new Date(r.timestamp).getTime();
      const key = `${timeKey}-${r.value}`;
      return !isNaN(timeKey) && !existingMap.has(key);
    });

    if (newItems.length === 0) {
      toast({ 
        title: "Database Terkini", 
        description: `Semua data dari ${sourceLabel} sudah tersimpan.` 
      });
      setIsSyncing(false);
      return;
    }

    toast({ 
      title: "Sinkronisasi Database", 
      description: `Menambahkan ${newItems.length} data baru dari ${sourceLabel}...` 
    });

    try {
      const batchSize = 450; 
      let totalSaved = 0;

      for (let i = 0; i < newItems.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = newItems.slice(i, i + batchSize);
        
        chunk.forEach(r => {
          const docRef = doc(collection(db, "readings"));
          batch.set(docRef, {
            value: r.value,
            timestamp: r.timestamp,
            userId: user.uid,
            source: sourceLabel,
            createdAt: serverTimestamp()
          });
          totalSaved++;
        });
        
        await batch.commit();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const itemsToSync = newItems.slice(-500); 
      const syncParallel = async (items: Reading[]) => {
        const pLimit = 5; 
        for (let j = 0; j < items.length; j += pLimit) {
          const chunk = items.slice(j, j + pLimit);
          await Promise.all(chunk.map(item => syncToGoogleSheets(item.value, item.timestamp)));
        }
      };
      syncParallel(itemsToSync).catch(e => console.error("Sheets sync background error:", e));

      toast({ 
        title: "Berhasil Diperbarui", 
        description: `${totalSaved} data baru telah tersimpan di database terpusat.` 
      });
    } catch (err) {
      console.error("Ingestion Error:", err);
      toast({ 
        title: "Gagal Menyimpan", 
        description: "Kesalahan saat menulis ke database.", 
        variant: "destructive" 
      });
    } finally {
      setIsSyncing(false);
    }
  }, [db, user, viewingOwner, allReadings, isSyncing, loadingReadings]);

  const addManualReading = (value: number, timestamp: string) => {
    const reading: Reading = {
      id: `manual-${Date.now()}`,
      value,
      timestamp,
      source: "Manual"
    };
    handleIngestData([reading], "Manual");
  };

  if (loadingReadings || loadingPerms) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Memuat Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white/80 backdrop-blur-sm border border-primary/10 rounded-[1.5rem] shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <Database className="h-3 w-3" /> Sumber Data:
          </span>
          <Button 
            variant={!viewingOwner ? "default" : "outline"} 
            size="sm" 
            onClick={() => setViewingOwner(null)}
            className="rounded-xl h-10 px-6 font-bold"
          >
            Data Saya
          </Button>
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
        {isSyncing && (
          <div className="flex items-center gap-2 text-primary text-xs font-bold animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" /> Sedang Menulis...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={cn("space-y-8", (!viewingOwner) ? "lg:col-span-8" : "lg:col-span-12")}>
          <MetricsGrid readings={allReadings} minRange={minRange} maxRange={maxRange} />
          
          <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
            <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between px-10 pt-10 gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-800">
                  <Activity className="h-6 w-6 text-primary" /> Visualisasi Tren
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  <Calendar className="h-3 w-3" /> {allReadings.length} Total Data
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
              {!viewingOwner && (
                <>
                  <TabsTrigger value="libre" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest text-orange-600 data-[state=active]:bg-white">
                    <Smartphone className="h-4 w-4 mr-2" /> Libre 3 Sync
                  </TabsTrigger>
                  <TabsTrigger value="dexcom" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest text-blue-600 data-[state=active]:bg-white">
                    <Radio className="h-4 w-4 mr-2" /> Dexcom Sync
                  </TabsTrigger>
                  <TabsTrigger value="clarity" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest text-emerald-600 data-[state=active]:bg-white">
                    <FileText className="h-4 w-4 mr-2" /> Impor Clarity
                  </TabsTrigger>
                  <TabsTrigger value="sync" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white">
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Contour Care
                  </TabsTrigger>
                  <TabsTrigger value="sharing" className="rounded-2xl py-3 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white">
                    <Users className="h-4 w-4 mr-2" /> Izin Akses
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
              {!viewingOwner && (
                <>
                  <TabsContent value="libre">
                    <LibreSync onSyncComplete={(data) => handleIngestData(data, "Libre 3")} isOwner={true} />
                  </TabsContent>
                  <TabsContent value="dexcom">
                    <DexcomSync onSyncComplete={(data) => handleIngestData(data, "Dexcom CGM")} isOwner={true} />
                  </TabsContent>
                  <TabsContent value="clarity">
                    <ClarityImport onImportComplete={(data) => handleIngestData(data, "Dexcom Clarity")} isOwner={true} />
                  </TabsContent>
                  <TabsContent value="sync">
                    <GoogleSheetsSync 
                      onImport={(data) => handleIngestData(data, "Contour Care")} 
                      defaultUrl={GOOGLE_SHEETS_CSV_URL}
                      autoSync={true} 
                    />
                  </TabsContent>
                  <TabsContent value="sharing">
                    <SharedAccessManager />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>

        {!viewingOwner && (
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem]">
              <CardHeader className="px-10 pt-10 pb-4">
                <CardTitle className="text-2xl font-black text-primary">Input Manual</CardTitle>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <ReadingForm onAdd={addManualReading} />
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
