-- Drop existing policies that allow all authenticated users
DROP POLICY IF EXISTS "Projects are viewable by authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON public.tasks;

-- Projects: Only project managers can view and create projects
CREATE POLICY "Project managers can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'project_manager'));

-- Tasks: Project managers see all, members see only assigned tasks
CREATE POLICY "Users can view relevant tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'project_manager') 
  OR auth.uid() = assigned_to
);

-- Only project managers can create projects
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Project managers can create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'project_manager'));

-- Only project managers can create tasks
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Project managers can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'project_manager'));