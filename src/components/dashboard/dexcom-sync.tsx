
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Activity, Loader2, RefreshCw, ShieldCheck, Info, AlertTriangle } from "lucide-react";
import { syncDexcomData } from "@/app/actions/dexcom-action";
import { useToast } from "@/hooks/use-toast";
import { Reading } from "./gula-dashboard";

interface DexcomSyncProps {
  onSyncComplete: (readings: Reading[]) => void;
  isOwner: boolean;
}

export function DexcomSync({ onSyncComplete, isOwner }: DexcomSyncProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isUS, setIsUS] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    if (!username || !password) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Silakan masukkan username dan password Dexcom Anda.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const dexcomReadings = await syncDexcomData({
        accountName: username,
        password: password,
        isUS: isUS,
        minutes: 1440, // Ambil data 24 jam terakhir
      });

      if (dexcomReadings && dexcomReadings.length > 0) {
        onSyncComplete(dexcomReadings);
        toast({
          title: "Sinkronisasi Berhasil",
          description: `Berhasil menarik ${dexcomReadings.length} data dari Dexcom CGM.`,
        });
      } else {
        toast({
          title: "Tidak Ada Data Baru",
          description: "Tidak ditemukan data glukosa baru dari akun Dexcom Anda.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Gagal Sinkronisasi",
        description: error.message || "Pastikan fitur 'Share' di aplikasi Dexcom Anda sudah aktif.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <Card className="border-none shadow-sm bg-slate-50">
        <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
          <ShieldCheck className="h-8 w-8 opacity-20" />
          <p>Hanya pemilik data yang dapat mengonfigurasi sinkronisasi Dexcom.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden animate-in fade-in duration-500">
      <CardHeader className="bg-blue-600 text-white p-8">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8" />
          <div>
            <CardTitle className="text-2xl font-black">Dexcom CGM Sync</CardTitle>
            <CardDescription className="text-blue-100">
              Hubungkan akun Dexcom Share Anda untuk sinkronisasi otomatis.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">Cara Menghubungkan:</p>
            <ol className="list-decimal ml-4 space-y-1 opacity-80">
              <li>Buka aplikasi <b>Dexcom Mobile</b> di HP Anda.</li>
              <li>Pastikan fitur <b>Share</b> sudah AKTIF di aplikasi tersebut.</li>
              <li>Gunakan kredensial (username/password) yang sama dengan aplikasi.</li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Username Dexcom</Label>
            <Input 
              placeholder="Username anda" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="rounded-2xl h-14 bg-slate-50 border-none focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="rounded-2xl h-14 bg-slate-50 border-none focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Lokasi Akun (Server US)</p>
            <p className="text-xs text-slate-500">Aktifkan jika akun Anda terdaftar di Region Amerika Serikat.</p>
          </div>
          <Switch checked={isUS} onCheckedChange={setIsUS} />
        </div>

        <div className="flex flex-col gap-4">
          <Button 
            onClick={handleSync} 
            disabled={isLoading} 
            className="h-16 rounded-2xl text-lg font-black gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <RefreshCw className="h-6 w-6" />}
            Sinkronkan Data Sekarang
          </Button>
          <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3" /> Sinkronisasi Aman via Dexcom Share API
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-[10px] text-amber-700 font-medium">
          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
          <p>Catatan: Jika Anda baru saja mengaktifkan fitur Share, mungkin diperlukan waktu beberapa menit sebelum data dapat ditarik oleh aplikasi ini.</p>
        </div>
      </CardContent>
    </Card>
  );
}
