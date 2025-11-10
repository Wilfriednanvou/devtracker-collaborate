-- Update task policies: members can update status of assigned tasks
DROP POLICY IF EXISTS "Task creators and assignees can update tasks" ON public.tasks;

-- Members can update their assigned tasks (mainly status)
CREATE POLICY "Assignees can update their tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (auth.uid() = assigned_to)
WITH CHECK (auth.uid() = assigned_to);

-- Project managers can update all tasks (assignment, description, etc.)
CREATE POLICY "Project managers can update all tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'project_manager'))
WITH CHECK (public.has_role(auth.uid(), 'project_manager'));