import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen, ListTodo, Calendar, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { MemberStats } from "@/components/MemberStats";
import { UpcomingDeadlines } from "@/components/UpcomingDeadlines";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  estimated_hours: number | null;
  projects: {
    name: string;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isProjectManager } = useUserRole();

  const [projects, setProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  useEffect(() => {
    if (user) {
      fetchProjects();
      if (!isProjectManager) {
        fetchMyTasks();
      }
    }
  }, [user, isProjectManager]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const fetchMyTasks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("tasks")
      .select(`
        *,
        projects(name)
      `)
      .eq("assigned_to", user.id)
      .order("due_date", { ascending: true });

    setMyTasks((data as unknown as Task[]) || []);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("projects").insert({
      name: newProject.name,
      description: newProject.description,
      owner_id: user.id,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Projet créé !",
        description: `Le projet "${newProject.name}" a été créé.`,
      });
      setDialogOpen(false);
      setNewProject({ name: "", description: "" });
      fetchProjects();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
              {isProjectManager && (
                <Badge variant="default" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Chef de projet
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {isProjectManager
                ? "Vue d'ensemble de vos projets et tâches"
                : "Vos tâches et projets"}
            </p>
          </div>

          {isProjectManager && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau projet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateProject}>
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau projet</DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouveau projet pour organiser vos tâches
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du projet</Label>
                      <Input
                        id="name"
                        placeholder="Mon super projet"
                        value={newProject.name}
                        onChange={(e) =>
                          setNewProject({ ...newProject, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Description du projet..."
                        value={newProject.description}
                        onChange={(e) =>
                          setNewProject({ ...newProject, description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Créer le projet</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!isProjectManager && myTasks.length > 0 && (
          <div className="mb-8 space-y-6">
            <MemberStats tasks={myTasks} />

            <div className="grid gap-6 lg:grid-cols-2">
              <UpcomingDeadlines tasks={myTasks} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    Mes tâches en cours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myTasks.filter((t) => t.status !== "completed").slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-all hover-scale animate-fade-in"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          {task.projects && (
                            <p className="text-xs text-muted-foreground">
                              {task.projects.name}
                            </p>
                          )}
                        </div>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.due_date).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      )}
                      <Badge
                        variant={task.status === "in_progress" ? "default" : "secondary"}
                        className="mt-2"
                      >
                        {task.status === "todo" ? "À faire" : "En cours"}
                      </Badge>
                    </div>
                  ))}
                  {myTasks.filter((t) => t.status !== "completed").length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      Et {myTasks.filter((t) => t.status !== "completed").length - 5} autre(s) tâche(s)
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {myTasks.filter((t) => t.status === "completed").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    Tâches terminées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myTasks.filter((t) => t.status === "completed").slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-all hover-scale animate-fade-in opacity-75"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate line-through">{task.title}</p>
                          {task.projects && (
                            <p className="text-xs text-muted-foreground">
                              {task.projects.name}
                            </p>
                          )}
                        </div>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.due_date).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      )}
                      <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                        Terminée
                      </Badge>
                    </div>
                  ))}
                  {myTasks.filter((t) => t.status === "completed").length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      Et {myTasks.filter((t) => t.status === "completed").length - 5} autre(s) tâche(s) terminée(s)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            {isProjectManager ? "Mes projets" : "Projets disponibles"}
          </h3>

          {projects.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-2">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">Aucun projet</h3>
                <p className="text-muted-foreground">
                  {isProjectManager ? "Créez votre premier projet pour commencer" : "Aucun projet disponible"}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover-scale animate-fade-in"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      <CardTitle>{project.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {project.description || "Aucune description"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
