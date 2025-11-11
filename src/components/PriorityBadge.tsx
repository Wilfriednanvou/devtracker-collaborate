import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high" | "urgent";
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const config = {
    urgent: {
      label: "Urgent",
      icon: AlertCircle,
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
    high: {
      label: "Haute",
      icon: ArrowUp,
      className: "bg-orange-500 hover:bg-orange-600 text-white",
    },
    medium: {
      label: "Moyenne",
      icon: Minus,
      className: "bg-yellow-500 hover:bg-yellow-600 text-white",
    },
    low: {
      label: "Basse",
      icon: ArrowDown,
      className: "bg-green-500 hover:bg-green-600 text-white",
    },
  };

  const { label, icon: Icon, className } = config[priority];

  return (
    <Badge className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};
