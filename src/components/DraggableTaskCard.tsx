import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Calendar, AlertCircle } from "lucide-react";
import { PriorityBadge } from "./PriorityBadge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[] | null;
  due_date: string | null;
  profiles: {
    full_name: string;
  } | null;
}

interface DraggableTaskCardProps {
  task: Task;
  onTaskClick: (taskId: string) => void;
}

export const DraggableTaskCard = ({ task, onTaskClick }: DraggableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={() => onTaskClick(task.id)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
            <PriorityBadge priority={task.priority} />
          </div>
          {task.description && (
            <CardDescription className="line-clamp-2">
              {task.description}
            </CardDescription>
          )}

          <div className="flex flex-wrap gap-1">
            {task.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {task.profiles && (
          <p className="text-sm text-muted-foreground">
            Assignée à {task.profiles.full_name}
          </p>
        )}
        
        {task.due_date && (
          <div className="flex items-center gap-2 text-sm">
            {new Date(task.due_date) < new Date() ? (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  En retard de {formatDistanceToNow(new Date(task.due_date), { locale: fr })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Échéance {formatDistanceToNow(new Date(task.due_date), { addSuffix: true, locale: fr })}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
