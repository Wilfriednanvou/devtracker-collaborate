import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { StatusBadge } from "@/components/StatusBadge";
import { DraggableTaskCard } from "@/components/DraggableTaskCard";
import { Card } from "@/components/ui/card";
import { ListTodo } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[] | null;
  due_date: string | null;
  profiles: {
    full_name: string;
  } | null;
}

interface DroppableTaskColumnProps {
  status: "todo" | "in_progress" | "completed";
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export const DroppableTaskColumn = ({
  status,
  tasks,
  onTaskClick,
}: DroppableTaskColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-sm text-muted-foreground">({tasks.length})</span>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-3 min-h-[200px] p-3 rounded-lg transition-colors ${
          isOver ? "bg-accent/50" : "bg-transparent"
        }`}
      >
        {tasks.length === 0 ? (
          <Card className="p-8">
            <div className="text-center space-y-2">
              <ListTodo className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucune tâche</p>
            </div>
          </Card>
        ) : (
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <DraggableTaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};
