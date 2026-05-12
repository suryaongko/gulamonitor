"use client";

import React from "react";
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface BloodSugarChartProps {
  readings: Reading[];
  minRange: number;
  maxRange: number;
}

export function BloodSugarChart({ readings, minRange, maxRange }: BloodSugarChartProps) {
  // Sort chronologically for chart
  const data = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: r.value,
      fullDate: new Date(r.timestamp).toLocaleDateString()
    }));

  if (readings.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl">
        Add readings to see trends
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#266BBF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#266BBF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 12, fill: '#888'}} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 12, fill: '#888'}} 
            domain={['auto', 'auto']}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 shadow-xl rounded-xl border">
                    <p className="text-xs font-semibold text-muted-foreground">{payload[0].payload.fullDate} {payload[0].payload.time}</p>
                    <p className="text-lg font-bold text-primary">{payload[0].value} mg/dL</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={maxRange} stroke="#1FCBDB" strokeDasharray="3 3" label={{ position: 'right', value: 'High', fill: '#1FCBDB', fontSize: 10 }} />
          <ReferenceLine y={minRange} stroke="#266BBF" strokeDasharray="3 3" label={{ position: 'right', value: 'Low', fill: '#266BBF', fontSize: 10 }} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#266BBF" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
