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

        // Deteksi header dan parse data
        // Dexcom Clarity CSV biasanya memiliki header di baris ke-12 atau baris pertama tergantung versi
        let dataStarted = false;
        
        for (let line of lines) {
          if (!line.trim()) continue;
          
          const parts = line.split(/[,;]/); // Support comma or semicolon (German Excel)
          
          // Cari baris yang berisi data glukosa (biasanya ada angka glukosa di kolom ke-7 atau ke-2)
          // Format umum: Timestamp, Glucose Value
          if (parts.length >= 2) {
            const timestampStr = parts[1]?.trim();
            const valueStr = parts[2]?.trim() || parts[1]?.trim();
            
            const date = new Date(timestampStr);
            const value = parseFloat(valueStr?.replace(',', '.'));

            if (!isNaN(date.getTime()) && !isNaN(value) && value > 0) {
              readings.push({
                id: `clarity-${date.getTime()}`,
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
            description: `Berhasil memproses ${readings.length} data dari file Clarity.`,
          });
        } else {
          throw new Error("Tidak ditemukan data glukosa yang valid dalam file ini.");
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

  if (!isOwner) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-emerald-600 text-white p-8">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl font-black">Dexcom Clarity CSV Import</CardTitle>
              <CardDescription className="text-emerald-100">
                Gunakan file laporan dari portal Clarity untuk data riwayat yang lebih lengkap.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Cara Mendapatkan File CSV:
            </h4>
            <ol className="text-sm text-slate-600 space-y-3 list-decimal ml-4 font-medium">
              <li>Buka website <b>clarity.dexcom.eu</b> (untuk Jerman/Eropa) dan login.</li>
              <li>Klik menu <b>"Export"</b> (Ekspor) di bagian atas.</li>
              <li>Pilih rentang waktu (misal: 14 hari terakhir) dan pilih format <b>CSV</b>.</li>
              <li>Simpan file tersebut ke HP/Komputer Anda, lalu unggah di sini.</li>
            </ol>
          </div>

          <div className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[2rem] p-12 transition-colors hover:border-emerald-100 group">
            <div className="bg-emerald-50 p-6 rounded-full text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <Upload className="h-10 w-10" />
            </div>
            <div className="text-center space-y-2 mb-8">
              <p className="text-xl font-black text-slate-800">Pilih File CSV Clarity</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Format: .csv • Max 10MB</p>
            </div>
            
            <Label htmlFor="clarity-upload" className="cursor-pointer">
              <div className="bg-emerald-600 hover:bg-emerald-700 text-white h-16 px-10 rounded-2xl flex items-center justify-center font-black text-lg gap-3 shadow-lg shadow-emerald-100 transition-all active:scale-95">
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                Pilih & Unggah File
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
              Sistem akan otomatis menyaring data duplikat. Anda bisa mengunggah file Clarity kapan saja untuk melengkapi grafik yang kosong jika sensor sempat terputus dari "Share".
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
