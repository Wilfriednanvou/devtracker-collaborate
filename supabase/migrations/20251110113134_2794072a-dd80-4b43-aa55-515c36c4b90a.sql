-- Add priority, tags, and time management features to tasks
ALTER TABLE public.tasks
ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN tags text[],
ADD COLUMN estimated_hours numeric,
ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Create index for tags search
CREATE INDEX idx_tasks_tags ON public.tasks USING GIN(tags);

-- Create index for parent tasks
CREATE INDEX idx_tasks_parent ON public.tasks(parent_task_id);

-- Add mentions support to comments
ALTER TABLE public.comments
ADD COLUMN mentioned_users uuid[];

-- Create index for mentioned users
CREATE INDEX idx_comments_mentioned ON public.comments USING GIN(mentioned_users);

-- Create function to notify mentioned users
CREATE OR REPLACE FUNCTION public.notify_mentioned_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_user uuid;
  task_title text;
BEGIN
  -- Get task title
  SELECT title INTO task_title FROM public.tasks WHERE id = NEW.task_id;
  
  -- Notify each mentioned user
  IF NEW.mentioned_users IS NOT NULL THEN
    FOREACH mentioned_user IN ARRAY NEW.mentioned_users
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, related_task_id)
      VALUES (
        mentioned_user,
        'Vous avez été mentionné',
        'Vous avez été mentionné dans un commentaire sur "' || task_title || '"',
        'comment_added',
        NEW.task_id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for mention notifications
CREATE TRIGGER on_user_mentioned
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mentioned_users();

-- Create function to notify on approaching deadlines (to be called daily)
CREATE OR REPLACE FUNCTION public.notify_approaching_deadlines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify users 24 hours before deadline
  INSERT INTO public.notifications (user_id, title, message, type, related_task_id)
  SELECT 
    t.assigned_to,
    'Échéance approchante',
    'La tâche "' || t.title || '" est due dans moins de 24 heures',
    'deadline_approaching',
    t.id
  FROM public.tasks t
  WHERE t.assigned_to IS NOT NULL
    AND t.due_date IS NOT NULL
    AND t.status != 'completed'
    AND t.due_date > now()
    AND t.due_date < now() + interval '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.related_task_id = t.id
        AND n.type = 'deadline_approaching'
        AND n.created_at > now() - interval '24 hours'
    );
END;
$$;

-- Add notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_assigned boolean DEFAULT true,
  status_changed boolean DEFAULT true,
  comment_added boolean DEFAULT true,
  deadline_approaching boolean DEFAULT true,
  mentioned boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);