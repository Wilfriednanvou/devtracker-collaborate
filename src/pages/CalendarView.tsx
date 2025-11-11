import { Navbar } from "@/components/Navbar";
import { TaskCalendar } from "@/components/TaskCalendar";

export default function CalendarView() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Calendrier des tâches</h2>
          <p className="text-muted-foreground mt-1">
            Visualisez toutes vos échéances sur un calendrier
          </p>
        </div>

        <TaskCalendar />
      </main>
    </div>
  );
}
