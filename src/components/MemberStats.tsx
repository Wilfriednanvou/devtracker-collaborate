import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface Task {
  id: string;
  status: "todo" | "in_progress" | "completed";
  due_date: string | null;
  estimated_hours: number | null;
}

interface MemberStatsProps {
  tasks: Task[];
}

export const MemberStats = ({ tasks }: MemberStatsProps) => {
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;

  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "completed") return false;
    return new Date(t.due_date) < new Date();
  }).length;

  const totalEstimatedHours = tasks.reduce((acc, task) => {
    return acc + (task.estimated_hours || 0);
  }, 0);

  const stats = [
    {
      title: "Tâches terminées",
      value: completedTasks,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "En cours",
      value: inProgressTasks,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "À faire",
      value: todoTasks,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "En retard",
      value: overdueTasks,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover-scale animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalEstimatedHours > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Heures estimées totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{totalEstimatedHours}</span>
              <span className="text-muted-foreground">heures</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
