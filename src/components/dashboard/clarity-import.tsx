
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Loader2, Info, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Reading } from "./gula-dashboard";

interface ClarityImportProps {
  onImportComplete: (readings: Reading[]) => void;
  isOwner: boolean;
}

export function ClarityImport({ onImportComplete, isOwner }: ClarityImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseClarityDate = (dateStr: string) => {
    if (!dateStr) return new Date(NaN);
    
    // Bersihkan karakter kutipan dan spasi berlebih
    const cleanStr = dateStr.replace(/"/g, "").trim();
    
    // 1. Coba standar ISO
    const isoDate = new Date(cleanStr);
    if (!isNaN(isoDate.getTime())) return isoDate;

    // 2. Parsing manual format Jerman/Eropa: DD.MM.YYYY HH:mm:ss atau DD.MM.YYYY, HH:mm:ss
    // Split berdasarkan pemisah umum di format Jerman
    const parts = cleanStr.split(/[\.\/\s,:]+/).filter(p => p !== "");
    
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      
      const hour = parts[3] ? parseInt(parts[3], 10) : 0;
      const min = parts[4] ? parseInt(parts[4], 10) : 0;
      const sec = parts[5] ? parseInt(parts[5], 10) : 0;
      
      const d = new Date(year, month, day, hour, min, sec);
      return d;
    }
    return new Date(NaN);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({
        title: "Format Salah",
        description: "Pastikan Anda mengunggah file .csv asli dari Dexcom Clarity.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    toast({ title: "Memproses File", description: "Sedang membaca data glukosa..." });
    
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("File kosong atau tidak terbaca.");

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
        const readings: Reading[] = [];

        let headerIndex = -1;
        let delimiter = ",";
        let timestampIdx = -1;
        let glucoseIdx = -1;

        // 1. Deteksi Header & Delimiter secara dinamis (Cari kolom waktu dan glukosa)
        for (let i = 0; i < Math.min(lines.length, 150); i++) {
          const line = lines[i].toLowerCase();
          // Coba beberapa delimiter umum
          const currentDelimiter = line.includes(";") ? ";" : (line.includes(",") ? "," : "\t");
          const headers = line.split(currentDelimiter).map(h => h.trim().replace(/"/g, ""));
          
          // Keyword pencarian diperluas untuk format Jerman (Gerätezeit, Glukosewert)
          const hasTime = headers.some(h => 
            h.includes("timestamp") || h.includes("zeitstempel") || 
            h.includes("gerätezeit") || h.includes("systemzeit") ||
            (h.includes("datum") && h.includes("uhrzeit")) ||
            h === "zeit"
          );
          
          const hasGlucose = headers.some(h => 
            h.includes("glucose") || h.includes("glukose") || 
            h.includes("mg/dl") || (h.includes("wert") && !h.includes("status")) ||
            h.includes("bezel")
          );

          if (hasTime && hasGlucose) {
            headerIndex = i;
            delimiter = currentDelimiter;
            timestampIdx = headers.findIndex(h => 
              h.includes("timestamp") || h.includes("zeitstempel") || 
              h.includes("gerätezeit") || h.includes("systemzeit") ||
              (h.includes("datum") && h.includes("uhrzeit")) ||
              h === "zeit"
            );
            glucoseIdx = headers.findIndex(h => 
              h.includes("glucose") || h.includes("glukose") || 
              h.includes("mg/dl") || (h.includes("wert") && !h.includes("status")) ||
              h.includes("bezel")
            );
            break;
          }
        }

        if (headerIndex === -1) {
          throw new Error("Format header tidak ditemukan. Pastikan Anda mengunduh file 'Export' (Ekspor) dari portal Clarity.");
        }

        // 2. Ekstraksi Data
        for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i];
          const parts = line.split(delimiter).map(p => p.trim().replace(/"/g, ""));
          
          if (parts.length <= Math.max(timestampIdx, glucoseIdx)) continue;

          const timestampPart = parts[timestampIdx];
          const valuePart = parts[glucoseIdx];

          if (!timestampPart || !valuePart || valuePart === "") continue;

          let value: number = NaN;
          const lowValue = valuePart.toLowerCase();
          
          if (lowValue.includes("low") || lowValue.includes("niedrig")) {
            value = 39;
          } else if (lowValue.includes("high") || lowValue.includes("hoch")) {
            value = 401;
          } else {
            // Tangani format desimal Eropa (koma)
            const cleanValue = valuePart.replace(",", ".");
            value = parseFloat(cleanValue);
          }

          const date = parseClarityDate(timestampPart);

          if (!isNaN(date.getTime()) && !isNaN(value) && value > 0) {
            readings.push({
              id: `clarity-${date.getTime()}-${value}`,
              value: Math.round(value),
              timestamp: date.toISOString(),
            });
          }
        }

        if (readings.length > 0) {
          toast({ 
            title: "Data Ditemukan", 
            description: `Mempersiapkan ${readings.length} data glukosa untuk disimpan.` 
          });
          onImportComplete(readings);
        } else {
          throw new Error("Ditemukan 0 data glukosa yang valid. Periksa isi file CSV Anda.");
        }
      } catch (error: any) {
        toast({
          title: "Gagal Impor",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        if (event.target) event.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  if (!isOwner) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-emerald-600 text-white p-8">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl font-black">Dexcom Clarity CSV Import</CardTitle>
              <CardDescription className="text-emerald-100">
                Impor riwayat glukosa massal dari portal Dexcom Clarity Jerman.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Petunjuk Ekspor Jerman:
            </h4>
            <ol className="text-sm text-slate-600 space-y-3 list-decimal ml-4 font-medium">
              <li>Login ke <b>clarity.dexcom.eu</b>.</li>
              <li>Pilih menu <b>Export (Ekspor)</b> di sisi kiri.</li>
              <li>Pilih rentang waktu (misal: 14 hari atau 30 hari).</li>
              <li>Klik <b>Export (Ekspor)</b> dan pilih format <b>CSV</b>.</li>
              <li>Unggah file CSV yang terunduh di bawah ini.</li>
            </ol>
          </div>

          <div className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[2rem] p-12 transition-colors hover:border-emerald-100 group">
            <div className="bg-emerald-50 p-6 rounded-full text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <Upload className="h-10 w-10" />
            </div>
            
            <Label htmlFor="clarity-upload-final" className="cursor-pointer">
              <div className="bg-emerald-600 hover:bg-emerald-700 text-white h-16 px-10 rounded-2xl flex items-center justify-center font-black text-lg gap-3 shadow-lg transition-all active:scale-95">
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                Pilih File CSV Clarity
              </div>
              <Input 
                id="clarity-upload-final" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </Label>
            <p className="mt-4 text-xs text-slate-400 font-bold uppercase tracking-widest">
              Sistem akan otomatis menghapus duplikat data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
