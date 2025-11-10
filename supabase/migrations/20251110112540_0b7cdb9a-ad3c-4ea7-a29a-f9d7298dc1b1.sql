-- Add delete permissions for project managers

-- Allow project managers to delete any task
CREATE POLICY "Project managers can delete tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'project_manager'));

-- Allow project managers to delete any project
CREATE POLICY "Project managers can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'project_manager'));