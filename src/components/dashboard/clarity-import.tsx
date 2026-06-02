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
        const lines = text.split(/\r?\n/);
        const readings: Reading[] = [];

        // Deteksi pemisah (comma vs semicolon)
        const firstLine = lines[0] || "";
        const delimiter = firstLine.includes(";") ? ";" : ",";
        
        for (let line of lines) {
          if (!line.trim()) continue;
          
          const parts = line.split(delimiter);
          
          // Cari baris data: Clarity CSV biasanya punya Timestamp di kolom ke-2 (index 1) 
          // dan Nilai Glukosa di kolom ke-3 (index 2)
          if (parts.length >= 2) {
            const timestampPart = parts[1]?.trim();
            const valuePart = parts[2]?.trim();

            if (!timestampPart || !valuePart) continue;

            // Bersihkan data: Hapus tanda kutip jika ada
            const cleanTimestamp = timestampPart.replace(/"/g, "");
            const cleanValue = valuePart.replace(/"/g, "").replace(",", "."); // Handle German decimal comma

            const date = new Date(cleanTimestamp);
            const value = parseFloat(cleanValue);

            // Validasi: Pastikan tanggal valid dan angka glukosa masuk akal
            if (!isNaN(date.getTime()) && !isNaN(value) && value > 10 && value < 600) {
              readings.push({
                id: `clarity-${date.getTime()}-${value}`,
                value: value,
                timestamp: date.toISOString(),
              });
            }
          }
        }

        if (readings.length > 0) {
          onImportComplete(readings);
          toast({
            title: "Impor Berhasil",
            description: `Berhasil memproses ${readings.length} data glukosa.`,
          });
        } else {
          throw new Error("Tidak ditemukan data glukosa yang valid. Pastikan ini adalah file 'Export' CSV dari Clarity.");
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
              Cara Mendapatkan File yang Benar:
            </h4>
            <ol className="text-sm text-slate-600 space-y-3 list-decimal ml-4 font-medium">
              <li>Login ke <b>clarity.dexcom.eu</b>.</li>
              <li>Klik menu <b>"Export"</b> (bukan Download Report PDF).</li>
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
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Format: .csv (Jerman/Internasional)</p>
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
              Sistem mendukung format CSV Jerman (pemisah titik koma). Data yang sudah ada tidak akan diduplikasi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}