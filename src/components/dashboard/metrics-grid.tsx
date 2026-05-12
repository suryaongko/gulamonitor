"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Reading } from "./gula-dashboard";
import { Activity, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsGridProps {
  readings: Reading[];
  minRange: number;
  maxRange: number;
}

export function MetricsGrid({ readings, minRange, maxRange }: MetricsGridProps) {
  // Calculation: HbA1c estimation
  // Formula: HbA1c = (Avg Glucose + 46.7) / 28.7
  const calculateHbA1c = () => {
    if (readings.length === 0) return 0;
    const avg = readings.reduce((acc, r) => acc + r.value, 0) / readings.length;
    return ((avg + 46.7) / 28.7).toFixed(1);
  };

  // Calculation: Out of range percentage
  const calculateOutOfRange = () => {
    if (readings.length === 0) return 0;
    const outOfRangeCount = readings.filter(r => r.value < minRange || r.value > maxRange).length;
    return Math.round((outOfRangeCount / readings.length) * 100);
  };

  const latestReading = readings[0]?.value || 0;
  const isLatestInRange = latestReading >= minRange && latestReading <= maxRange;
  const hba1c = calculateHbA1c();
  const outOfRangePercent = calculateOutOfRange();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-none shadow-sm bg-white/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className={cn("p-2 rounded-xl", isLatestInRange ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Latest Reading</p>
            <p className="text-2xl font-bold">{latestReading} <span className="text-sm font-normal text-muted-foreground">mg/dL</span></p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Estimated HbA1c</p>
            <p className="text-2xl font-bold">{hba1c}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className={cn("p-2 rounded-xl", outOfRangePercent > 20 ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary")}>
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Out of Range</p>
            <p className="text-2xl font-bold">{outOfRangePercent}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Health Score</p>
            <p className="text-2xl font-bold">{Math.max(0, 100 - outOfRangePercent)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
