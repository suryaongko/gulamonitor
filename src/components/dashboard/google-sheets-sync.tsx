
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, Loader2, RefreshCw, AlertTriangle, ArrowDownAZ, CheckCircle2, Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Reading } from "./gula-dashboard";
import { Switch } from "@/components/ui/switch";

interface GoogleSheetsSyncProps {
  onImport: (readings: Reading[]) => void;
  defaultUrl?: string;
  autoSync?: boolean;
}

export function GoogleSheetsSync({ onImport, defaultUrl, autoSync: initialAutoSync = true }: GoogleSheetsSyncProps) {
  const [url, setUrl] = useState(defaultUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(initialAutoSync);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const parseBerlinDate = (dateStr: string) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.replace(/"/g, "").trim();
    const parts = cleanStr.split(/[\/\-\s:]/);
    
    if (parts.length >= 5) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const yearStr = parts[2];
      const year = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
      const hour = parseInt(parts[3], 10);
      const min = parseInt(parts[4], 10);
      const sec = parts[5] ? parseInt(parts[5], 10) : 0;
      
      const d = new Date(year, month, day, hour, min, sec);
      return isNaN(d.getTime()) ? null : d;
    }
    const fallback = new Date(cleanStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const handleSync = useCallback(async (isSilent = false) => {
    if (!url || !url.includes("docs.google.com/spreadsheets")) {
      return;
    }

    if (!isSilent) setIsLoading(true);
    
    try {
      let fetchUrl = url;
      if (!fetchUrl.includes("output=csv")) {
        fetchUrl += (fetchUrl.includes("?") ? "&" : "?") + "output=csv";
      }

      const response = await fetch(`${fetchUrl}&t=${Date.now()}`);
      if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets.");
      
      const csvText = await response.text();
      const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
      
      if (rows.length <= 1) return;

      const dataRows = rows.slice(1);
      const importedReadings: Reading[] = dataRows
        .map((row) => {
          const columns = row.includes(";") ? row.split(";") : row.split(",");
          const timestampStr = columns[0]?.trim();
          const valueStr = columns[1]?.trim();
          if (!timestampStr || !valueStr) return null;

          const value = parseFloat(valueStr.replace(",", "."));
          const dateObj = parseBerlinDate(timestampStr);
          if (!dateObj || isNaN(value)) return null;

          return {
            id: `gs-${dateObj.getTime()}-${value}`, 
            value: value,
            timestamp: dateObj.toISOString(),
          };
        })
        .filter((r): r is Reading => r !== null);

      if (importedReadings.length > 0) {
        onImport(importedReadings);
      }
    } catch (error: any) {
      if (!isSilent) {
        toast({ title: "Sinkronisasi Gagal", description: error.message, variant: "destructive" });
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [url, onImport]);

  useEffect(() => {
    if (autoSync && url) {
      handleSync(true);
      syncTimerRef.current = setInterval(() => {
        handleSync(true);
      }, 30000);
    }
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [autoSync, url, handleSync]);

  return (
    <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
      <CardHeader className="bg-indigo-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl font-black">Contour Care Sync</CardTitle>
              <CardDescription className="text-indigo-100">Sinkronisasi data manual atau meteran Contour Care via Sheets.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/20 p-2 rounded-2xl">
            <Label htmlFor="auto-sync" className="text-xs font-black uppercase">Auto</Label>
            <Switch 
              id="auto-sync" 
              checked={autoSync} 
              onCheckedChange={setAutoSync} 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl space-y-4">
          <h4 className="font-black text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Integrasi Contour Care:
          </h4>
          <p className="text-sm text-blue-800 font-medium leading-relaxed">
            Data dari alat <b>Contour Care</b> Anda yang sudah masuk ke Google Sheets akan ditarik secara otomatis setiap 30 detik. Sistem akan menyaring duplikat secara cerdas untuk memastikan database terpusat Anda tetap bersih.
          </p>
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Link CSV Google Sheets</Label>
          <div className="flex flex-col md:flex-row gap-3">
            <Input 
              placeholder="Tempel link CSV hasil 'Publish to Web'..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-2xl h-14 bg-slate-50 border-none focus:bg-white transition-colors flex-1"
            />
            <Button 
              onClick={() => handleSync()} 
              disabled={isLoading || !url}
              className="rounded-2xl h-14 px-8 font-black gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
              Sync Contour
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
