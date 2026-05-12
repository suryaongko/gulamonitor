"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { PlusCircle, Loader2 } from "lucide-react";

const readingSchema = z.object({
  value: z.coerce.number().min(20, "Value too low").max(600, "Value too high"),
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
      timestamp: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (data: z.infer<typeof readingSchema>) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    onAdd(data.value, data.timestamp);
    form.reset({
      value: undefined,
      timestamp: new Date().toISOString().slice(0, 16),
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
              <Label>Reading (mg/dL)</Label>
              <FormControl>
                <Input type="number" placeholder="Enter value..." {...field} className="rounded-xl border-muted bg-muted/50 focus:bg-white transition-colors" />
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
              <Label>Date & Time</Label>
              <FormControl>
                <Input type="datetime-local" {...field} className="rounded-xl border-muted bg-muted/50 focus:bg-white transition-colors" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full rounded-xl gap-2 font-semibold shadow-lg shadow-primary/20" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          Add Reading
        </Button>
      </form>
    </Form>
  );
}
