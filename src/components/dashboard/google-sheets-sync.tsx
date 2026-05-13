
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
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
    const parts = dateStr.split(/[\/\-\s:]/);
    if (parts.length >= 5) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
      const hour = parseInt(parts[3]);
      const min = parseInt(parts[4]);
      const sec = parts[5] ? parseInt(parts[5]) : 0;
      
      const d = new Date(year, month, day, hour, min, sec);
      return isNaN(d.getTime()) ? null : d;
    }
    const fallback = new Date(dateStr);
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
            id: dateObj.getTime().toString(), 
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
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Pengaturan Sinkronisasi
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-sync" className="text-xs text-muted-foreground">Auto-Sync</Label>
            <Switch 
              id="auto-sync" 
              checked={autoSync} 
              onCheckedChange={setAutoSync} 
            />
          </div>
        </div>
        <CardDescription>
          Data ditarik otomatis dari Google Sheets setiap 30 detik.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gs-url">Link CSV "Publish to Web"</Label>
          <div className="flex flex-col md:flex-row gap-2">
            <Input 
              id="gs-url"
              placeholder="Tempel link CSV dari Google Sheets..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl flex-1"
            />
            <Button 
              onClick={() => handleSync()} 
              disabled={isLoading || !url}
              className="rounded-xl gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync Sekarang
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
