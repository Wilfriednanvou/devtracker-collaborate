import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Task {
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[] | null;
  due_date: string | null;
  profiles: {
    full_name: string;
  } | null;
}

interface ProjectStatsProps {
  tasks: Task[];
}

const COLORS = {
  todo: "hsl(var(--muted-foreground))",
  in_progress: "hsl(var(--warning))",
  completed: "hsl(var(--success))",
};

export const ProjectStats = ({ tasks }: ProjectStatsProps) => {
  const statusData = [
    { name: "À faire", value: tasks.filter((t) => t.status === "todo").length, fill: COLORS.todo },
    { name: "En cours", value: tasks.filter((t) => t.status === "in_progress").length, fill: COLORS.in_progress },
    { name: "Terminées", value: tasks.filter((t) => t.status === "completed").length, fill: COLORS.completed },
  ];

  const assigneeData = tasks
    .filter((t) => t.profiles)
    .reduce((acc: Record<string, number>, task) => {
      const name = task.profiles?.full_name || "Non assigné";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

  const assigneeChartData = Object.entries(assigneeData).map(([name, count]) => ({
    name,
    tasks: count,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Répartition par statut</CardTitle>
          <CardDescription>Aperçu des tâches par statut</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tâches par membre</CardTitle>
          <CardDescription>Répartition de la charge de travail</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={assigneeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tasks" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
