import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[] | null;
  due_date: string | null;
  created_at: string;
  assigned_to: string | null;
  profiles: {
    full_name: string;
  } | null;
}

export const useRealtimeTasks = (projectId: string | undefined) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) return;

    const fetchTasks = async () => {
      const { data } = await supabase
        .from("tasks")
        .select(`
          *,
          profiles!tasks_assigned_to_fkey(full_name)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      setTasks((data || []) as Task[]);
    };

    fetchTasks();

    const channel = supabase
      .channel(`tasks:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTimeout(async () => {
              const { data } = await supabase
                .from("tasks")
                .select(`
                  *,
                  profiles!tasks_assigned_to_fkey(full_name)
                `)
                .eq("id", payload.new.id)
                .single();

              if (data) {
                setTasks((prev) => [data as Task, ...prev]);
              }
            }, 0);
          } else if (payload.eventType === "UPDATE") {
            setTimeout(async () => {
              const { data } = await supabase
                .from("tasks")
                .select(`
                  *,
                  profiles!tasks_assigned_to_fkey(full_name)
                `)
                .eq("id", payload.new.id)
                .single();

              if (data) {
                setTasks((prev) =>
                  prev.map((task) => (task.id === data.id ? data as Task : task))
                );
              }
            }, 0);
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { tasks, setTasks };
};
