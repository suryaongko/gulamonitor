
"use client";

import React, { useState } from "react";
import { Reading } from "./gula-dashboard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReadingsListProps {
  readings: Reading[];
}

export function ReadingsList({ readings }: ReadingsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  if (readings.length === 0) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed">
        <p className="text-muted-foreground">Belum ada data yang tercatat.</p>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(readings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReadings = readings.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="space-y-4">
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Tanggal & Waktu</TableHead>
              <TableHead className="font-semibold text-right">Nilai (mg/dL)</TableHead>
              <TableHead className="font-semibold text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentReadings.map((reading) => (
              <TableRow key={reading.id}>
                <TableCell className="text-sm font-medium">
                  {format(new Date(reading.timestamp), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {reading.value}
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant={reading.value > 140 ? "destructive" : reading.value < 70 ? "secondary" : "default"}
                    className="rounded-full px-3"
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
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">
            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, readings.length)} dari {readings.length} data
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPrevPage} 
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium">
              Hal {currentPage} / {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
