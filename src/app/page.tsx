import { GulaDashboard } from "@/components/dashboard/gula-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline">GulaMonitor</h1>
            <p className="text-muted-foreground">Monitor and manage your blood sugar levels with ease.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium bg-secondary/10 text-secondary px-3 py-1 rounded-full">
              Live Health Sync
            </span>
          </div>
        </header>

        <GulaDashboard />
      </div>
    </main>
  );
}
