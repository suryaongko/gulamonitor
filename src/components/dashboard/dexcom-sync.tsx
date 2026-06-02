"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Activity, Loader2, RefreshCw, ShieldCheck, Info, AlertTriangle, Globe } from "lucide-react";
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
  const [isUS, setIsUS] = useState(false); // Default ke False untuk pengguna Internasional/Jerman
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
          description: `Berhasil menarik ${dexcomReadings.length} data glukosa.`,
        });
      } else {
        toast({
          title: "Tidak Ada Data Baru",
          description: "Tidak ditemukan data baru. Pastikan transmitter CGM Anda sedang aktif.",
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
    <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden animate-in fade-in duration-500">
      <CardHeader className="bg-blue-600 text-white p-8">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8" />
          <div>
            <CardTitle className="text-2xl font-black">Dexcom CGM Sync</CardTitle>
            <CardDescription className="text-blue-100">
              Integrasi data real-time dari sensor Dexcom G6/G7 Anda.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
          <Globe className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">Penting untuk Pengguna Jerman:</p>
            <p className="opacity-80">Pastikan opsi <b>"Gunakan Server Amerika (US)"</b> di bawah ini dalam posisi <b>MATI</b> agar aplikasi terhubung ke server Dexcom Eropa.</p>
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
            <p className="font-bold text-slate-800">Gunakan Server Amerika (US)</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {isUS ? "AKTIF (Server Amerika)" : "MATI (Server Internasional / Jerman)"}
            </p>
          </div>
          <Switch checked={isUS} onCheckedChange={setIsUS} />
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <Button 
            onClick={handleSync} 
            disabled={isLoading} 
            className="h-16 rounded-2xl text-lg font-black gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <RefreshCw className="h-6 w-6" />}
            Sinkronkan Data Glukosa
          </Button>
          <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
            Aman • Terkoneksi Langsung ke Dexcom Share API
          </p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-[10px] text-amber-700 font-medium">
          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
          <p>Tips: Jika gagal, pastikan fitur <b>Share</b> di menu aplikasi Dexcom HP Anda sudah dalam posisi menyala (On).</p>
        </div>
      </CardContent>
    </Card>
  );
}
