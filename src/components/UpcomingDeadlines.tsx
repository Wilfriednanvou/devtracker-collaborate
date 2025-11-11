import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { PriorityBadge } from "./PriorityBadge";

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  projects?: {
    name: string;
  };
}

interface UpcomingDeadlinesProps {
  tasks: Task[];
}

export const UpcomingDeadlines = ({ tasks }: UpcomingDeadlinesProps) => {
  const navigate = useNavigate();

  const upcomingTasks = tasks
    .filter((t) => t.due_date && t.status !== "completed")
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  if (upcomingTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Échéances à venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune échéance à venir
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Échéances à venir
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingTasks.map((task) => {
          const isOverdue = new Date(task.due_date!) < new Date();
          const daysUntil = formatDistanceToNow(new Date(task.due_date!), {
            locale: fr,
            addSuffix: true,
          });

          return (
            <div
              key={task.id}
              onClick={() => navigate(`/tasks/${task.id}`)}
              className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-all hover-scale animate-fade-in"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  {task.projects && (
                    <p className="text-xs text-muted-foreground">
                      {task.projects.name}
                    </p>
                  )}
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span
                  className={`text-xs ${
                    isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                  }`}
                >
                  {isOverdue ? "En retard" : daysUntil}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
