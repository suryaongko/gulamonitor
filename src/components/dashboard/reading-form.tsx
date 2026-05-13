
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { PlusCircle, Loader2 } from "lucide-react";

const readingSchema = z.object({
  value: z.coerce.number().min(20, "Nilai terlalu rendah").max(600, "Nilai terlalu tinggi"),
  timestamp: z.string(),
});

interface ReadingFormProps {
  onAdd: (value: number, timestamp: string) => void;
}

export function ReadingForm({ onAdd }: ReadingFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof readingSchema>>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      value: undefined,
      timestamp: "",
    },
  });

  useEffect(() => {
    // Set default local time in YYYY-MM-DDTHH:mm format for input
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    form.setValue("timestamp", localISOTime);
  }, [form]);

  const onSubmit = async (data: z.infer<typeof readingSchema>) => {
    setIsSubmitting(true);
    
    // Konversi local input time (YYYY-MM-DDTHH:mm) ke ISO String lengkap (UTC)
    // agar Google Sheets tidak salah menafsirkan jamnya.
    const isoTimestamp = new Date(data.timestamp).toISOString();
    
    await new Promise((resolve) => setTimeout(resolve, 300));
    onAdd(data.value, isoTimestamp);
    
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    
    form.reset({
      value: undefined,
      timestamp: localISOTime,
    });
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <Label>Hasil Gula Darah (mg/dL)</Label>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Masukkan nilai..." 
                  {...field} 
                  className="rounded-xl border-muted bg-muted/50 focus:bg-white transition-colors" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timestamp"
          render={({ field }) => (
            <FormItem>
              <Label>Waktu Pengukuran</Label>
              <FormControl>
                <Input 
                  type="datetime-local" 
                  {...field} 
                  className="rounded-xl border-muted bg-muted/50 focus:bg-white transition-colors" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full rounded-xl gap-2 font-semibold shadow-lg shadow-primary/20" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          Catat Hasil
        </Button>
      </form>
    </Form>
  );
}
