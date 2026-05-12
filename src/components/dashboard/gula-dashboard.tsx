
"use client";

import React, { useState, useMemo } from "react";
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
import { Activity, History, Settings, Sparkles, FileSpreadsheet, Loader2, Clock } from "lucide-react";
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { cn } from "@/lib/utils";

export interface Reading {
  id: string;
  value: number;
  timestamp: string;
}

export function GulaDashboard() {
  const db = useFirestore();
  const [minRange, setMinRange] = useState<number>(70);
  const [maxRange, setMaxRange] = useState<number>(140);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h'>('all');

  // Menggunakan Firebase Hook untuk mengambil data
  const readingsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "readings"), orderBy("timestamp", "desc"), limit(100));
  }, [db]);

  const { data: readingsData, loading } = useCollection(readingsQuery);

  const allReadings = useMemo(() => {
    if (!readingsData) return [];
    return readingsData.map(doc => ({
      id: doc.id,
      value: doc.value,
      timestamp: doc.timestamp
    })) as Reading[];
  }, [readingsData]);

  const filteredReadings = useMemo(() => {
    if (timeFilter === 'all') return allReadings;
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return allReadings.filter(r => new Date(r.timestamp) >= past24h);
  }, [allReadings, timeFilter]);

  const addReading = (value: number, timestamp: string) => {
    if (!db) return;
    
    // Simpan ke Firestore
    addDoc(collection(db, "readings"), {
      value,
      timestamp,
      createdAt: serverTimestamp()
    });
  };

  const importReadings = async (newReadings: Reading[]) => {
    if (!db) return;

    for (const reading of newReadings) {
      addDoc(collection(db, "readings"), {
        value: reading.value,
        timestamp: reading.timestamp,
        createdAt: serverTimestamp()
      });
    }
  };

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
            {timeFilter === '24h' && filteredReadings.length === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Tidak ada data dalam 24 jam terakhir.
              </p>
            )}
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
