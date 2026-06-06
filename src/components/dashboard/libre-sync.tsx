"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Loader2, RefreshCw, Smartphone, ShieldCheck, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import { syncLibreData } from "@/app/actions/libre-action";
import { useToast } from "@/hooks/use-toast";
import { Reading } from "./gula-dashboard";

interface LibreSyncProps {
  onSyncComplete: (readings: Reading[]) => void;
  isOwner: boolean;
}

export function LibreSync({ onSyncComplete, isOwner }: LibreSyncProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState<"EU" | "US" | "GLOBAL">("EU");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    if (!email || !password) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Silakan masukkan email dan password LibreLinkUp Anda.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const libreReadings = await syncLibreData({
        email,
        password,
        region,
      });

      if (libreReadings && libreReadings.length > 0) {
        onSyncComplete(libreReadings);
        toast({
          title: "Libre Sync Berhasil",
          description: `Berhasil menarik ${libreReadings.length} data glukosa terbaru dari server.`,
        });
      } else {
        toast({
          title: "Data Tidak Ditemukan",
          description: "Koneksi berhasil, namun server tidak mengembalikan data glukosa terbaru. Periksa status sensor.",
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

  if (!isOwner) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-orange-500 text-white p-8">
          <div className="flex items-center gap-3">
            <Smartphone className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl font-black">FreeStyle Libre 3 Sync</CardTitle>
              <CardDescription className="text-orange-100">
                Sinkronisasi otomatis via LibreLinkUp (Akun Follower).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 space-y-4">
            <h4 className="font-black text-orange-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Langkah Wajib di Aplikasi Libre 3:
            </h4>
            <ol className="text-sm text-orange-800 space-y-3 list-decimal ml-4 font-medium">
              <li>Di HP Pasien: Buka App Libre 3 &rarr; <b>Aplikasi Terhubung</b> &rarr; <b>LibreLinkUp</b>.</li>
              <li>Klik <b>Tambah Pengikut</b> dan masukkan email <u>akun kedua</u> Anda.</li>
              <li>Di HP Anda: Buka email tersebut, terima undangan, dan buat akun <b>LibreLinkUp</b>.</li>
              <li>Gunakan email & password akun <b>LibreLinkUp</b> tersebut di bawah ini.</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-800 font-medium">
              <b>Catatan:</b> Jika baru pertama kali menghubungkan, data mungkin membutuhkan waktu 5-10 menit untuk muncul di server cloud Abbott.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Akun Follower</Label>
              <Input 
                type="email"
                placeholder="email-follower@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
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

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Wilayah Server (Jerman pilih EU)</Label>
            <Select value={region} onValueChange={(val: any) => setRegion(val)}>
              <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="Pilih Region" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="EU">Eropa / Jerman (EU)</SelectItem>
                <SelectItem value="US">Amerika Serikat (US)</SelectItem>
                <SelectItem value="GLOBAL">Lainnya (Global)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSync} 
            disabled={isLoading} 
            className="w-full h-16 rounded-2xl text-lg font-black gap-3 shadow-lg shadow-orange-200 transition-all active:scale-95 bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <RefreshCw className="h-6 w-6" />}
            Mulai Sinkronisasi Libre 3
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
