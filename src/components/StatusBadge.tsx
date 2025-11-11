import { Badge } from "@/components/ui/badge";
import { Circle, CircleDashed, CheckCircle2 } from "lucide-react";

interface StatusBadgeProps {
  status: "todo" | "in_progress" | "completed";
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = {
    todo: {
      label: "À faire",
      icon: Circle,
      className: "bg-muted text-muted-foreground hover:bg-muted/80",
    },
    in_progress: {
      label: "En cours",
      icon: CircleDashed,
      className: "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20",
    },
    completed: {
      label: "Terminée",
      icon: CheckCircle2,
      className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};
