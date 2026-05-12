
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Reading } from "./gula-dashboard";

interface GoogleSheetsSyncProps {
  onImport: (readings: Reading[]) => void;
}

export function GoogleSheetsSync({ onImport }: GoogleSheetsSyncProps) {
  // Menggunakan link yang diberikan user sebagai default
  const [url, setUrl] = useState("https://docs.google.com/spreadsheets/d/e/2PACX-1vTGaOFv2lMN-vaZOXMzqGsit1PASt_vyU46mnY3hVpaOLKZMZ8bBSxDHzlMVmjB_P_rZM21dMM2LJLW/pub?gid=0&single=true&output=csv");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: "" });

  const handleSync = async () => {
    if (!url.includes("docs.google.com/spreadsheets") || !url.includes("output=csv")) {
      toast({
        title: "URL Tidak Valid",
        description: "Pastikan Anda menggunakan link 'Publish to web' dengan format CSV.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'idle', message: "" });

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets.");
      
      const csvText = await response.text();
      // Memproses baris dan menangani karakter newline yang berbeda
      const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
      
      // Skip header row
      const dataRows = rows.slice(1);
      
      const importedReadings: Reading[] = dataRows
        .map(row => {
          // Menangani CSV sederhana (pemisah koma)
          const columns = row.split(",");
          const timestamp = columns[0]?.trim();
          const valueStr = columns[1]?.trim();
          const value = parseFloat(valueStr);

          if (!timestamp || isNaN(value)) return null;

          return {
            id: Math.random().toString(36).substr(2, 9),
            value: value,
            timestamp: new Date(timestamp).toISOString(),
          };
        })
        .filter((r): r is Reading => r !== null);

      if (importedReadings.length === 0) {
        throw new Error("Tidak ada data valid yang ditemukan dalam file CSV. Pastikan kolom A adalah tanggal dan kolom B adalah angka.");
      }

      onImport(importedReadings);
      setStatus({ 
        type: 'success', 
        message: `Berhasil mengimpor ${importedReadings.length} data gula darah.` 
      });
      toast({
        title: "Sinkronisasi Berhasil",
        description: `${importedReadings.length} data telah ditambahkan.`
      });
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: error.message || "Terjadi kesalahan saat sinkronisasi." });
      toast({
        title: "Sinkronisasi Gagal",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          Google Sheets Sync
        </CardTitle>
        <CardDescription>
          Hubungkan data gula darah 3 bulan terakhir Anda langsung dari Google Sheets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gs-url">Link CSV "Publish to Web"</Label>
          <div className="flex gap-2">
            <Input 
              id="gs-url"
              placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl flex-1"
            />
            <Button 
              onClick={handleSync} 
              disabled={isLoading || !url}
              className="rounded-xl gap-2 min-w-[120px]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync Now
            </Button>
          </div>
        </div>

        {status.type === 'error' && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {status.message}
          </div>
        )}

        {status.type === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
            {status.message}
          </div>
        )}

        <div className="bg-muted/30 p-4 rounded-xl space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Instruksi:</p>
          <ol className="text-xs text-muted-foreground list-decimal ml-4 space-y-1">
            <li>Di Google Sheets, klik <b>File &gt; Share &gt; Publish to web</b>.</li>
            <li>Pilih tab data Anda dan pilih format <b>CSV</b>.</li>
            <li>Klik Publish dan tempel link-nya di atas (sudah terisi otomatis untuk Anda).</li>
            <li>Pastikan kolom A berisi Tanggal/Waktu dan kolom B berisi Nilai Gula Darah.</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
