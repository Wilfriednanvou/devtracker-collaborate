-- Add due_date to tasks table
ALTER TABLE public.tasks
ADD COLUMN due_date timestamp with time zone;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'task_assigned', 'status_changed', 'comment_added', 'deadline_approaching'
  related_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  related_project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System can create notifications (we'll use service role for this)
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to automatically create notification when task is assigned
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if task is assigned to someone and it's a new assignment
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_task_id, related_project_id)
    VALUES (
      NEW.assigned_to,
      'Nouvelle tâche assignée',
      'Vous avez été assigné à la tâche "' || NEW.title || '"',
      'task_assigned',
      NEW.id,
      NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for task assignment notifications
CREATE TRIGGER on_task_assigned
  AFTER INSERT OR UPDATE OF assigned_to ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assignment();

-- Create function to notify on status change
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify project managers when status changes
  IF OLD.status != NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_task_id, related_project_id)
    SELECT 
      ur.user_id,
      'Statut de tâche modifié',
      'La tâche "' || NEW.title || '" est passée de ' || OLD.status || ' à ' || NEW.status,
      'status_changed',
      NEW.id,
      NEW.project_id
    FROM public.user_roles ur
    WHERE ur.role = 'project_manager'
      AND ur.user_id != auth.uid(); -- Don't notify the user who made the change
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for status change notifications
CREATE TRIGGER on_status_changed
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_status_change();

-- Add attachments support to comments
ALTER TABLE public.comments
ADD COLUMN attachment_url text,
ADD COLUMN attachment_name text;