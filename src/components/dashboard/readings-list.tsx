"use client";

import React from "react";
import { Reading } from "./gula-dashboard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ReadingsListProps {
  readings: Reading[];
}

export function ReadingsList({ readings }: ReadingsListProps) {
  if (readings.length === 0) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed">
        <p className="text-muted-foreground">No readings recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-2xl border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Date & Time</TableHead>
            <TableHead className="font-semibold text-right">Value (mg/dL)</TableHead>
            <TableHead className="font-semibold text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {readings.map((reading) => (
            <TableRow key={reading.id}>
              <TableCell className="text-sm">
                {format(new Date(reading.timestamp), "MMM d, yyyy • h:mm a")}
              </TableCell>
              <TableCell className="text-right font-medium">
                {reading.value}
              </TableCell>
              <TableCell className="text-right">
                <Badge 
                  variant={reading.value > 140 ? "destructive" : reading.value < 70 ? "secondary" : "default"}
                  className="rounded-full px-3"
                >
                  {reading.value > 140 ? "High" : reading.value < 70 ? "Low" : "Normal"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
