
"use client";

import React, { useState } from "react";
import { Reading } from "./gula-dashboard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isValid } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadingsListProps {
  readings: Reading[];
}

export function ReadingsList({ readings }: ReadingsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  if (!readings || readings.length === 0) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed">
        <p className="text-muted-foreground font-medium italic">Belum ada data yang tercatat.</p>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(readings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReadings = readings.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const safeFormatDate = (timestamp: string) => {
    const d = new Date(timestamp);
    return isValid(d) ? format(d, "dd/MM/yyyy HH:mm") : "Format Salah";
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-white/80 backdrop-blur-sm rounded-[1.8rem] border border-slate-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-black text-[10px] uppercase tracking-widest px-8">Waktu Berlin</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Nilai (mg/dL)</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-right px-8">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentReadings.map((reading) => (
              <TableRow key={reading.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                <TableCell className="text-sm font-bold text-slate-600 px-8">
                  {safeFormatDate(reading.timestamp)}
                </TableCell>
                <TableCell className="text-right font-black text-slate-900 text-lg">
                  {reading.value}
                </TableCell>
                <TableCell className="text-right px-8">
                  <Badge 
                    variant={reading.value > 140 ? "destructive" : reading.value < 70 ? "secondary" : "default"}
                    className={cn(
                      "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none",
                      reading.value > 140 ? "bg-red-100 text-red-600" : 
                      reading.value < 70 ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                    )}
                  >
                    {reading.value > 140 ? "Tinggi" : reading.value < 70 ? "Rendah" : "Normal"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, readings.length)} dari {readings.length} data
          </p>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPrevPage} 
              disabled={currentPage === 1}
              className="h-10 w-10 rounded-xl border-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-black text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              className="h-10 w-10 rounded-xl border-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
