
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ReadingForm } from "./reading-form";
import { RangeSettings } from "./range-settings";
import { MetricsGrid } from "./metrics-grid";
import { ReadingsList } from "./readings-list";
import { AIInsightsCard } from "./ai-insights-card";
import { BloodSugarChart } from "./blood-sugar-chart";
import { GoogleSheetsSync } from "./google-sheets-sync";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, History, Settings, Sparkles, FileSpreadsheet, Loader2 } from "lucide-react";
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
  const [isSyncing, setIsSyncing] = useState(false);

  // Load readings from Firestore filtered by user ID
  const readingsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "readings"), 
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"), 
      limit(500)
    );
  }, [db, user]);

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
    if (!db || !user) return;
    
    try {
      await addDoc(collection(db, "readings"), {
        value,
        timestamp,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, timestamp, userEmail: user.email }),
      }).catch(err => console.error("Apps Script Error:", err));

      toast({ 
        title: "Data Disimpan", 
        description: "Data telah disimpan dan disinkronkan ke Google Sheets." 
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal menyimpan data", variant: "destructive" });
    }
  };

  const parseIndonesianDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[\/\-\s:]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
      const hour = parts[3] ? parseInt(parts[3]) : 0;
      const min = parts[4] ? parseInt(parts[4]) : 0;
      const d = new Date(year, month, day, hour, min);
      if (!isNaN(d.getTime())) return d;
    }
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const importReadings = useCallback(async (newReadings: Reading[]) => {
    if (!db || !user) return;
    let importedCount = 0;

    for (const reading of newReadings) {
      const exists = allReadings.some(r => r.timestamp === reading.timestamp && r.value === reading.value);
      if (!exists) {
        await addDoc(collection(db, "readings"), {
          value: reading.value,
          timestamp: reading.timestamp,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        importedCount++;
      }
    }
    return importedCount;
  }, [db, allReadings, user]);

  const handleAutoSync = useCallback(async () => {
    if (!user || !db) return;
    setIsSyncing(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_CSV_URL);
      if (!response.ok) throw new Error("Gagal mengambil data Sheets.");
      
      const csvText = await response.text();
      const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
      if (rows.length <= 1) return;

      const dataRows = rows.slice(1);
      const importedFromSheets: Reading[] = dataRows
        .map((row) => {
          const columns = row.includes(";") ? row.split(";") : row.split(",");
          const timestampStr = columns[0]?.trim();
          const valueStr = columns[1]?.trim();
          if (!timestampStr || !valueStr) return null;

          const value = parseFloat(valueStr.replace(",", "."));
          const dateObj = parseIndonesianDate(timestampStr);
          if (!dateObj || isNaN(value)) return null;

          return {
            id: dateObj.getTime().toString(), 
            value: value,
            timestamp: dateObj.toISOString(),
          };
        })
        .filter((r): r is Reading => r !== null);

      if (importedFromSheets.length > 0) {
        const count = await importReadings(importedFromSheets);
        if (count && count > 0) {
          toast({ title: "Sinkronisasi Otomatis", description: `${count} data baru dari Sheets telah ditambahkan.` });
        }
      }
    } catch (error) {
      console.error("Auto-sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, db, importReadings]);

  // Efek untuk menjalankan sinkronisasi otomatis saat pertama kali masuk dashboard
  useEffect(() => {
    if (user && db && !loading) {
      handleAutoSync();
    }
  }, [user, db, loading, handleAutoSync]);

  if (loading && allReadings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menghubungkan ke Health Sync...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <MetricsGrid readings={allReadings} minRange={minRange} maxRange={maxRange} />
        
        <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Glucose Trends
              {isSyncing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-2" />}
            </CardTitle>
            <div className="flex items-center bg-muted/50 p-1 rounded-lg">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("h-7 px-3 text-xs rounded-md", timeFilter === '24h' && "bg-white shadow-sm")}
                onClick={() => setTimeFilter('24h')}
              >
                24 Hours
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("h-7 px-3 text-xs rounded-md", timeFilter === 'all' && "bg-white shadow-sm")}
                onClick={() => setTimeFilter('all')}
              >
                All Time
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <BloodSugarChart readings={filteredReadings} minRange={minRange} maxRange={maxRange} />
          </CardContent>
        </Card>

        <Tabs defaultValue="readings" className="w-full">
          <TabsList className="bg-white/50 backdrop-blur-sm border p-1 rounded-xl">
            <TabsTrigger value="readings" className="flex items-center gap-2 rounded-lg">
              <History className="h-4 w-4" /> History
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2 rounded-lg">
              <Sparkles className="h-4 w-4" /> AI Insights
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2 rounded-lg">
              <FileSpreadsheet className="h-4 w-4" /> Sync Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="readings" className="mt-4">
            <ReadingsList readings={allReadings} />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-4">
            <AIInsightsCard readings={allReadings} minRange={minRange} maxRange={maxRange} />
          </TabsContent>

          <TabsContent value="sync" className="mt-4">
            <GoogleSheetsSync onImport={handleAutoSync} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="border-none shadow-md bg-white/80">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Activity className="h-5 w-5" /> New Reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReadingForm onAdd={addReading} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white/80">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Settings className="h-5 w-5" /> Healthy Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RangeSettings 
              minRange={minRange} 
              maxRange={maxRange} 
              onSave={(min, max) => {
                setMinRange(min);
                setMaxRange(max);
              }} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
