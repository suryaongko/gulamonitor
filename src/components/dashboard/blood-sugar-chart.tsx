"use client";

import React, { useMemo } from "react";
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  ReferenceLine
} from "recharts";
import { Reading } from "./gula-dashboard";

interface BloodSugarChartProps {
  readings: Reading[];
  minRange: number;
  maxRange: number;
}

export function BloodSugarChart({ readings, minRange, maxRange }: BloodSugarChartProps) {
  // Sort chronologically for chart and ensure we have unique data points
  const data = useMemo(() => {
    return [...readings]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(r => ({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: r.value,
        fullDate: new Date(r.timestamp).toLocaleDateString(),
        iso: r.timestamp
      }));
  }, [readings]);

  if (readings.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-slate-50 border border-dashed rounded-3xl gap-2">
        <Activity className="h-10 w-10 text-slate-200" />
        <p className="font-medium">Belum ada data untuk ditampilkan</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#266BBF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#266BBF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 11, fill: '#64748b'}}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 11, fill: '#64748b'}} 
            domain={['auto', 'auto']}
            padding={{ top: 20, bottom: 20 }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white/95 backdrop-blur-md p-4 shadow-2xl rounded-2xl border border-primary/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {payload[0].payload.fullDate} {payload[0].payload.time}
                    </p>
                    <p className="text-2xl font-black text-primary leading-none">
                      {payload[0].value} <span className="text-xs font-medium">mg/dL</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine 
            y={maxRange} 
            stroke="#ef4444" 
            strokeDasharray="4 4" 
            strokeWidth={1}
            label={{ position: 'right', value: 'MAX', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} 
          />
          <ReferenceLine 
            y={minRange} 
            stroke="#3b82f6" 
            strokeDasharray="4 4" 
            strokeWidth={1}
            label={{ position: 'right', value: 'MIN', fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' }} 
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#266BBF" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={1000}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#266BBF' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

import { Activity } from "lucide-react";
