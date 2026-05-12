"use client";

import React, { useState, useEffect } from "react";
import { ReadingForm } from "./reading-form";
import { RangeSettings } from "./range-settings";
import { MetricsGrid } from "./metrics-grid";
import { ReadingsList } from "./readings-list";
import { AIInsightsCard } from "./ai-insights-card";
import { BloodSugarChart } from "./blood-sugar-chart";
import { GoogleSheetsSync } from "./google-sheets-sync";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, History, Settings, Sparkles, FileSpreadsheet } from "lucide-react";

export interface Reading {
  id: string;
  value: number;
  timestamp: string;
}

export function GulaDashboard() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [minRange, setMinRange] = useState<number>(70);
  const [maxRange, setMaxRange] = useState<number>(140);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Mock initial data
    const initialReadings: Reading[] = [
      { id: "1", value: 95, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { id: "2", value: 155, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
      { id: "3", value: 82, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      { id: "4", value: 110, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
    ];
    setReadings(initialReadings);
    setIsLoaded(true);
  }, []);

  const addReading = (value: number, timestamp: string) => {
    const newReading: Reading = {
      id: Math.random().toString(36).substr(2, 9),
      value,
      timestamp,
    };
    setReadings(prev => [newReading, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const importReadings = (newReadings: Reading[]) => {
    setReadings(prev => {
      // Merge and remove duplicates if needed, then sort
      const combined = [...newReadings, ...prev];
      return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <MetricsGrid readings={readings} minRange={minRange} maxRange={maxRange} />
        
        <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Glucose Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BloodSugarChart readings={readings} minRange={minRange} maxRange={maxRange} />
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
            <ReadingsList readings={readings} />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-4">
            <AIInsightsCard readings={readings} minRange={minRange} maxRange={maxRange} />
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
