-- Allow project managers to update user roles
CREATE POLICY "Project managers can update user roles"
ON public.user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'project_manager'
  )
);

-- Allow project managers to insert user roles
CREATE POLICY "Project managers can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'project_manager'
  )
);

-- Allow project managers to delete user roles
CREATE POLICY "Project managers can delete user roles"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'project_manager'
  )
);