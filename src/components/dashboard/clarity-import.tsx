"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Reading } from "./gula-dashboard";

interface ClarityImportProps {
  onImportComplete: (readings: Reading[]) => void;
  isOwner: boolean;
}

export function ClarityImport({ onImportComplete, isOwner }: ClarityImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Format Salah",
        description: "Pastikan Anda mengunggah file .csv dari Dexcom Clarity.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        const readings: Reading[] = [];

        let headerIndex = -1;
        let delimiter = ",";
        let timestampIdx = -1;
        let glucoseIdx = -1;

        // 1. Cari baris Header yang sebenarnya (biasanya mengandung kata 'Timestamp' atau 'Glukose')
        for (let i = 0; i < Math.min(lines.length, 20); i++) {
          const line = lines[i].toLowerCase();
          if (
            (line.includes("timestamp") || line.includes("zeitstempel") || line.includes("date") || line.includes("datum")) &&
            (line.includes("glucose") || line.includes("glukose") || line.includes("wert") || line.includes("value"))
          ) {
            headerIndex = i;
            delimiter = lines[i].includes(";") ? ";" : ",";
            const headers = lines[i].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ""));
            
            // Cari indeks kolom berdasarkan nama (mendukung Bahasa Inggris & Jerman)
            timestampIdx = headers.findIndex(h => h.includes("timestamp") || h.includes("zeitstempel") || h.includes("date") || h.includes("datum"));
            glucoseIdx = headers.findIndex(h => h.includes("glucose") || h.includes("glukose") || (h.includes("wert") && !h.includes("status")) || h.includes("value"));
            
            break;
          }
        }

        // Jika pencarian header gagal, coba fallback ke index standar Clarity Export
        if (headerIndex === -1) {
          headerIndex = 0;
          timestampIdx = 1;
          glucoseIdx = 2;
          delimiter = lines[0].includes(";") ? ";" : ",";
        }

        // 2. Proses baris data mulai dari setelah header
        for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(delimiter);
          if (parts.length <= Math.max(timestampIdx, glucoseIdx)) continue;

          const timestampPart = parts[timestampIdx]?.trim().replace(/"/g, "");
          const valuePart = parts[glucoseIdx]?.trim().replace(/"/g, "");

          if (!timestampPart || !valuePart) continue;

          // Tangani format angka Jerman (koma sebagai desimal)
          const cleanValue = valuePart.replace(",", ".");
          const value = parseFloat(cleanValue);
          
          // Parsing Tanggal
          const date = new Date(timestampPart);

          // Validasi: Pastikan tanggal valid dan angka glukosa masuk akal
          if (!isNaN(date.getTime()) && !isNaN(value) && value > 10 && value < 600) {
            readings.push({
              id: `clarity-${date.getTime()}-${value}`,
              value: value,
              timestamp: date.toISOString(),
            });
          }
        }

        if (readings.length > 0) {
          // Urutkan berdasarkan waktu
          const sortedReadings = readings.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          onImportComplete(sortedReadings);
          toast({
            title: "Impor Berhasil",
            description: `Berhasil memproses ${readings.length} data glukosa dari Clarity.`,
          });
        } else {
          throw new Error("Tidak ditemukan data glukosa yang valid. Pastikan ini adalah file 'Export' CSV dari portal Clarity (bukan cetak laporan PDF).");
        }
      } catch (error: any) {
        toast({
          title: "Gagal Membaca File",
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
                Gunakan file laporan dari portal Clarity untuk sinkronisasi data riwayat.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Cara Mendapatkan File yang Benar (Portal Jerman):
            </h4>
            <ol className="text-sm text-slate-600 space-y-3 list-decimal ml-4 font-medium">
              <li>Login ke <b>clarity.dexcom.eu</b>.</li>
              <li>Pilih rentang waktu (misal: 14 hari terakhir).</li>
              <li>Klik tombol <b>"Export"</b> (Ekspor) di menu atas. <i>Catatan: Jangan pilih "Print Report", karena itu akan menghasilkan PDF.</i></li>
              <li>Simpan file <b>.csv</b> ke perangkat Anda.</li>
              <li>Unggah file tersebut di tombol bawah ini.</li>
            </ol>
          </div>

          <div className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[2rem] p-12 transition-colors hover:border-emerald-100 group">
            <div className="bg-emerald-50 p-6 rounded-full text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <Upload className="h-10 w-10" />
            </div>
            <div className="text-center space-y-2 mb-8">
              <p className="text-xl font-black text-slate-800">Pilih File CSV Clarity</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Format: .csv (Mendukung Regional Jerman)</p>
            </div>
            
            <Label htmlFor="clarity-upload" className="cursor-pointer">
              <div className="bg-emerald-600 hover:bg-emerald-700 text-white h-16 px-10 rounded-2xl flex items-center justify-center font-black text-lg gap-3 shadow-lg shadow-emerald-100 transition-all active:scale-95">
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                Unggah CSV Clarity
              </div>
              <Input 
                id="clarity-upload" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </Label>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              Sistem akan otomatis mendeteksi format file Clarity Anda. Data yang sudah ada tidak akan diduplikasi di database.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
