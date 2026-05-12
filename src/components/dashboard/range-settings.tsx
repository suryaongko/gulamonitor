"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface RangeSettingsProps {
  minRange: number;
  maxRange: number;
  onSave: (min: number, max: number) => void;
}

export function RangeSettings({ minRange, maxRange, onSave }: RangeSettingsProps) {
  const [min, setMin] = React.useState(minRange.toString());
  const [max, setMax] = React.useState(maxRange.toString());

  const handleSave = () => {
    const minVal = parseInt(min);
    const maxVal = parseInt(max);
    if (isNaN(minVal) || isNaN(maxVal) || minVal >= maxVal) {
      toast({
        title: "Invalid Range",
        description: "Minimum value must be less than maximum value.",
        variant: "destructive",
      });
      return;
    }
    onSave(minVal, maxVal);
    toast({
      title: "Settings Saved",
      description: "Your personalized healthy range has been updated.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min-range">Min (mg/dL)</Label>
          <Input 
            id="min-range"
            type="number" 
            value={min} 
            onChange={(e) => setMin(e.target.value)} 
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-range">Max (mg/dL)</Label>
          <Input 
            id="max-range"
            type="number" 
            value={max} 
            onChange={(e) => setMax(e.target.value)} 
            className="rounded-xl"
          />
        </div>
      </div>
      <Button variant="outline" className="w-full rounded-xl border-primary text-primary hover:bg-primary/5" onClick={handleSave}>
        Update Range
      </Button>
    </div>
  );
}
