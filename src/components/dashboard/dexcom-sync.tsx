"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Activity, Loader2, RefreshCw, ShieldCheck, Info, AlertTriangle, Globe, CheckCircle2 } from "lucide-react";
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
        minutes: 1440,
      });

      if (dexcomReadings && dexcomReadings.length > 0) {
        onSyncComplete(dexcomReadings);
        toast({
          title: "Sinkronisasi Berhasil",
          description: `Berhasil menarik ${dexcomReadings.length} data glukosa terbaru.`,
        });
      } else {
        toast({
          title: "Tidak Ada Data",
          description: "Server Dexcom terhubung, tapi tidak ada data glukosa. Pastikan sensor Anda aktif dan sedang mengirim data.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Gagal Sinkronisasi",
        description: error.message,
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
          <p>Fitur sinkronisasi hanya tersedia untuk pemilik data utama.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-blue-600 text-white p-8">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl font-black">Dexcom Sync (Jerman/EU)</CardTitle>
              <CardDescription className="text-blue-100">
                Hubungkan data sensor Dexcom G6/G7 Anda secara otomatis.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="space-y-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" /> 
              Langkah Wajib di Aplikasi Dexcom HP:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-xs font-black text-blue-600 uppercase">Step 1</p>
                <p className="text-sm font-medium text-slate-600">
                  Buka menu <b>Verbindungen</b> (Koneksi) di app Dexcom Anda.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-xs font-black text-blue-600 uppercase">Step 2</p>
                <p className="text-sm font-medium text-slate-600">
                  Klik <b>Dexcom Verbindung über Share</b> dan aktifkan (tambah pengikut).
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-1">Status Sensor:</p>
              <p className="opacity-80 leading-relaxed">
                Berdasarkan foto Anda, sensor Anda sedang <b>"Nicht aktiv"</b>. Sinkronisasi hanya akan berhasil jika sensor sedang berjalan dan mengirim angka glukosa ke HP Anda.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Username Dexcom</Label>
              <Input 
                placeholder="Username akun Dexcom" 
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

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" /> Lokasi Server
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {isUS ? "AMERIKA (US)" : "INTERNASIONAL / JERMAN (OUS)"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400">Pilih OUS untuk Jerman</span>
              <Switch checked={isUS} onCheckedChange={setIsUS} />
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-2">
            <Button 
              onClick={handleSync} 
              disabled={isLoading} 
              className="h-16 rounded-2xl text-lg font-black gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <RefreshCw className="h-6 w-6" />}
              Sinkronkan Sekarang
            </Button>
            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
              Keamanan Terjamin • Koneksi Langsung ke Dexcom Share API
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
