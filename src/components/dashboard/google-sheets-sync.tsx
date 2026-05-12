
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

  const parseIndonesianDate = (dateStr: string) => {
    // Mencoba menangani format DD/MM/YYYY HH:mm atau format standar
    if (!dateStr) return null;
    
    // Jika formatnya DD/MM/YYYY
    const parts = dateStr.split(/[\/\-\s:]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JS month 0-indexed
      const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
      
      const hour = parts[3] ? parseInt(parts[3]) : 0;
      const min = parts[4] ? parseInt(parts[4]) : 0;
      
      const d = new Date(year, month, day, hour, min);
      if (!isNaN(d.getTime())) return d;
    }
    
    // Fallback ke parser standar
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

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
      if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets. Pastikan link sudah di-Publish to Web.");
      
      const csvText = await response.text();
      const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
      
      if (rows.length <= 1) {
        throw new Error("File kosong atau hanya berisi header.");
      }

      // Skip header row
      const dataRows = rows.slice(1);
      
      const importedReadings: Reading[] = dataRows
        .map((row, index) => {
          // Menangani pemisah koma atau titik koma (sering di regional Indonesia)
          const columns = row.includes(";") ? row.split(";") : row.split(",");
          
          let timestampStr = columns[0]?.trim();
          let valueStr = columns[1]?.trim();

          if (!timestampStr || !valueStr) return null;

          // Bersihkan string angka (tanganin koma sebagai desimal)
          const cleanValueStr = valueStr.replace(",", ".");
          const value = parseFloat(cleanValueStr);
          
          const dateObj = parseIndonesianDate(timestampStr);

          if (!dateObj || isNaN(value)) {
            console.warn(`Baris ${index + 2} dilewati: format tidak valid`, { timestampStr, valueStr });
            return null;
          }

          return {
            id: Math.random().toString(36).substr(2, 9),
            value: value,
            timestamp: dateObj.toISOString(),
          };
        })
        .filter((r): r is Reading => r !== null);

      if (importedReadings.length === 0) {
        throw new Error("Tidak ada data valid yang ditemukan. Pastikan Kolom A = Tanggal, Kolom B = Angka Gula Darah.");
      }

      onImport(importedReadings);
      setStatus({ 
        type: 'success', 
        message: `Berhasil mengimpor ${importedReadings.length} data gula darah.` 
      });
      toast({
        title: "Sinkronisasi Berhasil",
        description: `${importedReadings.length} data telah ditambahkan ke riwayat.`
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
          Hubungkan data gula darah Anda langsung dari spreadsheet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gs-url">Link CSV "Publish to Web"</Label>
          <div className="flex flex-col md:flex-row gap-2">
            <Input 
              id="gs-url"
              placeholder="Tempel link CSV di sini..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl flex-1"
            />
            <Button 
              onClick={handleSync} 
              disabled={isLoading || !url}
              className="rounded-xl gap-2 min-w-[140px]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sinkronkan Sekarang
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
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Analisa Kolom:</p>
          <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-1">
            <li><b>Kolom A:</b> Tanggal & Waktu (Contoh: 27/10/2023 08:00)</li>
            <li><b>Kolom B:</b> Nilai Gula Darah (Angka saja, misal: 120 atau 120,5)</li>
            <li>Pemisah desimal boleh menggunakan titik (.) atau koma (,)</li>
          </ul>
          
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-4">Cara Publish:</p>
          <ol className="text-xs text-muted-foreground list-decimal ml-4 space-y-1">
            <li>Buka Google Sheets &gt; <b>File</b> &gt; <b>Share</b> &gt; <b>Publish to web</b>.</li>
            <li>Pilih tab data Anda, ubah "Entire Document" menjadi nama sheet Anda.</li>
            <li>Ubah format dari "Web Page" menjadi <b>Comma-separated values (.csv)</b>.</li>
            <li>Klik Publish dan pastikan link berakhir dengan <code>output=csv</code>.</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
