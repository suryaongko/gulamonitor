"use client";

import React, { useState } from "react";
import { Reading } from "./gula-dashboard";
import { Button } from "@/components/ui/button";
import { analyzeBloodSugarPatterns, AIHealthInsightToolOutput } from "@/ai/flows/ai-health-insight-tool-flow";
import { Sparkles, Loader2, Info, TrendingUp, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface AIInsightsCardProps {
  readings: Reading[];
  minRange: number;
  maxRange: number;
}

export function AIInsightsCard({ readings, minRange, maxRange }: AIInsightsCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AIHealthInsightToolOutput | null>(null);

  const generateInsights = async () => {
    if (readings.length === 0) {
      toast({
        title: "No Data",
        description: "Please add some readings first before generating insights.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await analyzeBloodSugarPatterns({
        readings: readings.map(r => ({ value: r.value, timestamp: r.timestamp })),
        minHealthyRange: minRange,
        maxHealthyRange: maxRange,
        additionalContext: "Feeling a bit tired in the afternoons."
      });
      setInsights(result);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">AI Health Analysis</h3>
        <Button 
          onClick={generateInsights} 
          disabled={isLoading || readings.length === 0}
          className="rounded-xl gap-2 shadow-md hover:shadow-lg transition-all"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate New Insights
        </Button>
      </div>

      {!insights && !isLoading && (
        <div className="text-center py-16 bg-white/40 border border-dashed rounded-2xl flex flex-col items-center gap-2">
          <div className="p-3 bg-primary/5 rounded-full text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
          <p className="text-muted-foreground max-w-xs">
            Unlock personalized health analysis powered by AI based on your readings.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-16 bg-white/40 border border-dashed rounded-2xl animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-muted-foreground">AI is analyzing your patterns...</p>
        </div>
      )}

      {insights && !isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-sm bg-blue-50/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                <Info className="h-4 w-4" /> Summary
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{insights.summary}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-cyan-50/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-secondary font-bold uppercase text-xs tracking-wider">
                <TrendingUp className="h-4 w-4" /> Trends
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{insights.trends}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-emerald-50/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase text-xs tracking-wider">
                <Heart className="h-4 w-4" /> Recommendations
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{insights.actionableRecommendations}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
