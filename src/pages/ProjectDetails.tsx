import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, Trash2, Calendar as CalendarIcon, Info, Edit } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { TaskFilters } from "@/components/TaskFilters";
import { ProjectStats } from "@/components/ProjectStats";
import { TagInput } from "@/components/TagInput";
import { PriorityBadge } from "@/components/PriorityBadge";
import { DroppableTaskColumn } from "@/components/DroppableTaskColumn";
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { DraggableTaskCard } from "@/components/DraggableTaskCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface Profile {
  id: string;
  full_name: string;
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isProjectManager } = useUserRole();

  const [project, setProject] = useState<Project | null>(null);
  const { tasks, setTasks } = useRealtimeTasks(id);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    tags: [] as string[],
    due_date: undefined as Date | undefined,
    estimated_hours: "",
  });
  const [editProject, setEditProject] = useState({
    name: "",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchProfiles();
    }
  }, [id, user]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le projet",
        variant: "destructive",
      });
      navigate("/");
    } else {
      setProject(data);
      setEditProject({
        name: data.name,
        description: data.description || "",
      });
    }
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name");
    setProfiles(data || []);
    setLoading(false);
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Block drag & drop for members
    if (!isProjectManager) {
      toast({
        title: "Action non autorisée",
        description: "Seuls les chefs de projet peuvent déplacer les tâches",
        variant: "destructive",
      });
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as "todo" | "in_progress" | "completed";
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la tâche",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tâche déplacée",
          description: `La tâche a été déplacée vers "${newStatus}"`,
        });
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    const { error } = await supabase.from("tasks").insert({
      title: newTask.title,
      description: newTask.description,
      project_id: id,
      created_by: user.id,
      assigned_to: newTask.assigned_to || null,
      priority: newTask.priority,
      tags: newTask.tags.length > 0 ? newTask.tags : null,
      due_date: newTask.due_date ? newTask.due_date.toISOString() : null,
      estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tâche créée !",
        description: `La tâche "${newTask.title}" a été créée.`,
      });
      setDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        assigned_to: "",
        priority: "medium",
        tags: [],
        due_date: undefined,
        estimated_hours: "",
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès.",
      });
      navigate("/");
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const projectSchema = z.object({
      name: z.string().trim().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
      description: z.string().trim().max(500, "La description est trop longue"),
    });

    try {
      projectSchema.parse(editProject);

      const { error } = await supabase
        .from("projects")
        .update({
          name: editProject.name.trim(),
          description: editProject.description.trim() || null,
        })
        .eq("id", id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le projet",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Projet modifié",
          description: "Le projet a été modifié avec succès.",
        });
        setEditDialogOpen(false);
        fetchProject();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());


      const matchesStatus = statusFilter === "all" || task.status === statusFilter;

      const matchesAssignee =
        assigneeFilter === "all" ||
        (assigneeFilter === "unassigned" && !task.assigned_to) ||
        task.assigned_to === assigneeFilter;

      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [tasks, searchQuery, statusFilter, assigneeFilter]);

  const tasksByStatus = useMemo(
    () => ({
      todo: filteredTasks.filter((t) => t.status === "todo"),
      in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
      completed: filteredTasks.filter((t) => t.status === "completed"),
    }),
    [filteredTasks]
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const completionRate = tasks.length > 0
    ? Math.round((tasksByStatus.completed.length / tasks.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{project?.name}</h2>
              <p className="text-muted-foreground mt-1">
                {project?.description || "Aucune description"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isProjectManager && (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleUpdateProject}>
                      <DialogHeader>
                        <DialogTitle>Modifier le projet</DialogTitle>
                        <DialogDescription>
                          Modifiez les informations du projet
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Nom du projet</Label>
                          <Input
                            id="edit-name"
                            value={editProject.name}
                            onChange={(e) =>
                              setEditProject({ ...editProject, name: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={editProject.description}
                            onChange={(e) =>
                              setEditProject({ ...editProject, description: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Enregistrer</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button disabled={!isProjectManager}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvelle tâche
                          </Button>
                        </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleCreateTask}>
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                    <DialogDescription>
                      Ajoutez une tâche à ce projet
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre de la tâche</Label>
                      <Input
                        id="title"
                        placeholder="Ma tâche"
                        value={newTask.title}
                        onChange={(e) =>
                          setNewTask({ ...newTask, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Description de la tâche..."
                        value={newTask.description}
                        onChange={(e) =>
                          setNewTask({ ...newTask, description: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="assigned_to">Assigner à</Label>
                        <Select
                          value={newTask.assigned_to}
                          onValueChange={(value) =>
                            setNewTask({ ...newTask, assigned_to: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un membre" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priorité</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                            setNewTask({ ...newTask, priority: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Basse</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Haute</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Date d'échéance</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newTask.due_date && "text-muted-foreground"
                            )}
                            type="button"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newTask.due_date
                              ? format(newTask.due_date, "PPP", { locale: fr })
                              : "Choisir une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newTask.due_date}
                            onSelect={(date) =>
                              setNewTask({ ...newTask, due_date: date })
                            }
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <TagInput
                        tags={newTask.tags}
                        onChange={(tags) => setNewTask({ ...newTask, tags })}
                        placeholder="Ajouter des tags..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimated_hours">Heures estimées</Label>
                      <Input
                        id="estimated_hours"
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Ex: 8"
                        value={newTask.estimated_hours}
                        onChange={(e) =>
                          setNewTask({ ...newTask, estimated_hours: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Créer la tâche</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
                    </div>
                  </TooltipTrigger>
                  {!isProjectManager && (
                    <TooltipContent>
                      <p>Seuls les chefs de projet peuvent créer des tâches</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

            {isProjectManager && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer le projet
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Le projet "{project?.name}" et toutes ses tâches seront définitivement supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Progression du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {tasksByStatus.completed.length} / {tasks.length} tâches terminées
                  </span>
                  <span className="font-semibold">{completionRate}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <TaskFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          profiles={profiles}
        />

        <ProjectStats tasks={tasks} />

        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {["todo", "in_progress", "completed"].map((status) => (
              <DroppableTaskColumn
                key={status}
                status={status as any}
                tasks={tasksByStatus[status as keyof typeof tasksByStatus]}
                onTaskClick={(taskId) => navigate(`/tasks/${taskId}`)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <DraggableTaskCard
                task={activeTask}
                onTaskClick={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}
