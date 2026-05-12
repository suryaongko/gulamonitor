
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, Loader2, RefreshCw, CheckCircle2, Zap, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Reading } from "./gula-dashboard";
import { Switch } from "@/components/ui/switch";

interface GoogleSheetsSyncProps {
  onImport: (readings: Reading[]) => void;
  defaultUrl?: string;
}

export function GoogleSheetsSync({ onImport, defaultUrl }: GoogleSheetsSyncProps) {
  const [url, setUrl] = useState(defaultUrl || "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGaOFv2lMN-vaZOXMzqGsit1PASt_vyU46mnY3hVpaOLKZMZ8bBSxDHzlMVmjB_P_rZM21dMM2LJLW/pub?gid=0&single=true&output=csv");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: "" });

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

  const handleSync = useCallback(async (isSilent = false) => {
    if (!url.includes("docs.google.com/spreadsheets") || !url.includes("output=csv")) {
      if (!isSilent) toast({ title: "URL Tidak Valid", variant: "destructive" });
      return;
    }

    if (!isSilent) setIsLoading(true);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Gagal mengambil data.");
      
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
          const dateObj = parseIndonesianDate(timestampStr);
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
        if (!isSilent) {
          setStatus({ type: 'success', message: `Sinkronisasi berhasil: ${importedReadings.length} data.` });
          toast({ title: "Sinkronisasi Berhasil", description: `${importedReadings.length} data diperbarui.` });
        }
      }
    } catch (error: any) {
      if (!isSilent) {
        setStatus({ type: 'error', message: error.message });
        toast({ title: "Sinkronisasi Gagal", variant: "destructive" });
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [url, onImport]);

  useEffect(() => {
    if (autoSync && url) {
      handleSync(true);
    }
  }, [autoSync, url, handleSync]);

  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Google Sheets Sync
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
          Data ditarik otomatis dari Sheets, dan dikirim otomatis ke Sheets saat Anda menambah data baru.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gs-url">Link CSV "Publish to Web" (Input)</Label>
          <div className="flex flex-col md:flex-row gap-2">
            <Input 
              id="gs-url"
              placeholder="Tempel link CSV di sini..." 
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
              Sync Manual
            </Button>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                Sinkronisasi Dua Arah Aktif
                <Zap className="h-3 w-3 fill-emerald-600" />
              </p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                URL Web App Google Apps Script telah terpasang. Setiap kali Anda menambah data di HP, baris baru akan muncul di Google Sheets Anda secara otomatis.
              </p>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground break-all p-2 bg-muted/30 rounded-lg">
          <p className="font-semibold mb-1 uppercase">Outgoing Web App Endpoint:</p>
          https://script.google.com/macros/s/.../exec
        </div>
      </CardContent>
    </Card>
  );
}
