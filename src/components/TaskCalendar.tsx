import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  due_date: string;
  status: string;
  priority: string;
}

export const TaskCalendar = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasksWithDueDate();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const tasksOnDate = tasks.filter((task) =>
        isSameDay(new Date(task.due_date), selectedDate)
      );
      setSelectedTasks(tasksOnDate);
    }
  }, [selectedDate, tasks]);

  const fetchTasksWithDueDate = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, due_date, status, priority")
      .not("due_date", "is", null)
      .order("due_date", { ascending: true });

    if (data) {
      setTasks(data);
    }
  };

  const modifiers = {
    hasTask: tasks.map((task) => new Date(task.due_date)),
    overdue: tasks
      .filter((task) => new Date(task.due_date) < new Date() && task.status !== "completed")
      .map((task) => new Date(task.due_date)),
  };

  const modifiersStyles = {
    hasTask: { fontWeight: "bold" },
    overdue: { color: "hsl(var(--destructive))" },
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Calendrier des échéances</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            locale={fr}
            className={cn("rounded-md border pointer-events-auto")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? format(selectedDate, "d MMMM yyyy", { locale: fr })
              : "Sélectionnez une date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune tâche pour cette date
            </p>
          ) : (
            <div className="space-y-3">
              {selectedTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{task.title}</p>
                    <div className="flex gap-2">
                      {task.status === "completed" ? (
                        <Badge variant="secondary">✓ Terminée</Badge>
                      ) : new Date(task.due_date) < new Date() ? (
                        <Badge variant="destructive">En retard</Badge>
                      ) : (
                        <Badge>En cours</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
