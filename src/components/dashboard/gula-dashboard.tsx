
"use client";

import React, { useState, useMemo, useCallback } from "react";
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

export function GulaDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const [minRange, setMinRange] = useState<number>(70);
  const [maxRange, setMaxRange] = useState<number>(140);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h'>('all');

  // Load readings from Firestore filtered by user ID
  const readingsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "readings"), 
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"), 
      limit(200)
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
      // 1. Simpan ke Firestore
      await addDoc(collection(db, "readings"), {
        value,
        timestamp,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      // 2. Kirim ke Google Sheets secara otomatis (Background sync)
      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          value, 
          timestamp,
          userEmail: user.email 
        }),
      }).catch(err => console.error("Apps Script Error:", err));

      toast({ 
        title: "Data Disimpan", 
        description: "Data telah disimpan ke database dan sedang dikirim ke Google Sheets." 
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal menyimpan data", variant: "destructive" });
    }
  };

  const importReadings = useCallback(async (newReadings: Reading[]) => {
    if (!db || !user) return;

    for (const reading of newReadings) {
      const exists = allReadings.some(r => r.timestamp === reading.timestamp && r.value === reading.value);
      if (!exists) {
        await addDoc(collection(db, "readings"), {
          value: reading.value,
          timestamp: reading.timestamp,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
    }
  }, [db, allReadings, user]);

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
        <MetricsGrid readings={filteredReadings} minRange={minRange} maxRange={maxRange} />
        
        <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Glucose Trends
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
              <FileSpreadsheet className="h-4 w-4" /> Google Sheets
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="readings" className="mt-4">
            <ReadingsList readings={allReadings} />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-4">
            <AIInsightsCard readings={allReadings} minRange={minRange} maxRange={maxRange} />
          </TabsContent>

          <TabsContent value="sync" className="mt-4">
            <GoogleSheetsSync onImport={importReadings} />
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
