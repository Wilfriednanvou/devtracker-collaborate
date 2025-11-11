import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  attachment_url: string | null;
  attachment_name: string | null;
  profiles: {
    full_name: string;
  };
}

export const useRealtimeComments = (taskId: string | undefined) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!taskId) return;

    const fetchComments = async () => {
      const { data } = await supabase
        .from("comments")
        .select(`
          *,
          profiles(full_name)
        `)
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      setComments(data || []);
    };

    fetchComments();

    const channel = supabase
      .channel(`comments:${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setTimeout(async () => {
            const { data } = await supabase
              .from("comments")
              .select(`
                *,
                profiles(full_name)
              `)
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setComments((prev) => [...prev, data]);
              toast({
                title: "Nouveau commentaire",
                description: `${data.profiles.full_name} a ajouté un commentaire`,
              });
            }
          }, 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  return { comments, setComments };
};
