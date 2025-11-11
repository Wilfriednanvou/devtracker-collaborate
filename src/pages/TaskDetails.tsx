import { useEffect, useState } from "react";
import { z } from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeComments } from "@/hooks/useRealtimeComments";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Clock, User, Trash2, FileText, Download, Paperclip, Edit, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TagInput } from "@/components/TagInput";
import { FileUpload } from "@/components/FileUpload";
import { Input } from "@/components/ui/input";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[] | null;
  due_date: string | null;
  estimated_hours: number | null;
  parent_task_id: string | null;
  created_at: string;
  assigned_to: string | null;
  project_id: string;
  profiles: {
    full_name: string;
  } | null;
  projects: {
    name: string;
  };
}

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

interface Activity {
  id: string;
  action: string;
  details: any;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
}

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isProjectManager } = useUserRole();

  const [task, setTask] = useState<Task | null>(null);
  const { comments, setComments } = useRealtimeComments(id);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    tags: [] as string[],
    due_date: undefined as Date | undefined,
    estimated_hours: "",
  });

  useEffect(() => {
    if (id) {
      fetchTask();
      fetchActivities();
      fetchProfiles();
      fetchSubtasks();
    }
  }, [id]);

  useEffect(() => {
    if (task) {
      setEstimatedHours(task.estimated_hours?.toString() || "");
    }
  }, [task]);

  const fetchTask = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        profiles!tasks_assigned_to_fkey(full_name),
        projects(name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la tâche",
        variant: "destructive",
      });
      navigate("/");
    } else {
      setTask(data as unknown as Task);
    }
    setLoading(false);
  };

  const fetchActivities = async () => {
    const { data } = await supabase
      .from("activity_log")
      .select(`
        *,
        profiles(full_name)
      `)
      .eq("task_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    setActivities(data || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name");
    setProfiles(data || []);
  };

  const fetchSubtasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select(`
        *,
        profiles!tasks_assigned_to_fkey(full_name),
        projects(name)
      `)
      .eq("parent_task_id", id)
      .order("created_at", { ascending: false });

    setSubtasks((data as unknown as Task[]) || []);
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleStatusChange = async (newStatus: "todo" | "in_progress" | "completed") => {
    if (!task || !user) return;

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la tâche a été modifié.",
      });
      fetchTask();
      fetchActivities();
    }
  };

  const handleAssigneeChange = async (newAssignee: string) => {
    if (!task) return;

    const { error } = await supabase
      .from("tasks")
      .update({ assigned_to: newAssignee || null })
      .eq("id", task.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de changer l'assignation",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assignation mise à jour",
        description: "La tâche a été réassignée.",
      });
      fetchTask();
      fetchActivities();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    let finalAttachmentUrl = attachmentUrl;
    let finalAttachmentName = attachmentName;

    // Upload file if selected
    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(filePath, selectedFile);

      if (uploadError) {
        toast({
          title: "Erreur",
          description: "Impossible de télécharger le fichier",
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("task-attachments")
        .getPublicUrl(filePath);

      finalAttachmentUrl = publicUrl;
      finalAttachmentName = selectedFile.name;
    }

    const { error } = await supabase.from("comments").insert({
      task_id: id,
      user_id: user.id,
      content: newComment,
      attachment_url: finalAttachmentUrl || null,
      attachment_name: finalAttachmentName || null,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
      variant: "destructive",
      });
    } else {
      setNewComment("");
      setAttachmentUrl("");
      setAttachmentName("");
      setSelectedFile(null);
    }
  };

  const handleUpdateEstimatedHours = async () => {
    if (!task) return;

    const { error } = await supabase
      .from("tasks")
      .update({ estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null })
      .eq("id", task.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les heures estimées",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Heures estimées mises à jour",
      });
      fetchTask();
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée avec succès.",
      });
      navigate(`/projects/${task.project_id}`);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const taskSchema = z.object({
      title: z.string().trim().min(1, "Le titre est requis").max(200, "Le titre est trop long"),
      description: z.string().trim().max(2000, "La description est trop longue"),
      estimated_hours: z.string().refine(
        (val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0),
        "Les heures doivent être un nombre positif"
      ),
    });

    try {
      taskSchema.parse(editTask);

      const { error } = await supabase
        .from("tasks")
        .update({
          title: editTask.title.trim(),
          description: editTask.description.trim() || null,
          priority: editTask.priority,
          tags: editTask.tags.length > 0 ? editTask.tags : null,
          due_date: editTask.due_date ? editTask.due_date.toISOString() : null,
          estimated_hours: editTask.estimated_hours ? parseFloat(editTask.estimated_hours) : null,
        })
        .eq("id", id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier la tâche",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tâche modifiée",
          description: "La tâche a été modifiée avec succès.",
        });
        setEditDialogOpen(false);
        fetchTask();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!task) return null;

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const getActivityMessage = (activity: Activity) => {
    switch (activity.action) {
      case "task_created":
        return "a créé cette tâche";
      case "status_changed":
        return `a changé le statut de "${activity.details.old_status}" à "${activity.details.new_status}"`;
      case "assignment_changed":
        return "a modifié l'assignation";
      default:
        return activity.action;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/projects/${task.project_id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au projet
          </Button>

          <div className="flex items-center gap-2">
            {task.status !== "completed" && (isProjectManager || task.assigned_to === user?.id) && (
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleUpdateTask}>
                    <DialogHeader>
                      <DialogTitle>Modifier la tâche</DialogTitle>
                      <DialogDescription>
                        Modifiez les informations de la tâche
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Titre</Label>
                        <Input
                          id="edit-title"
                          value={editTask.title}
                          onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={editTask.description}
                          onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-priority">Priorité</Label>
                        <Select
                          value={editTask.priority}
                          onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                            setEditTask({ ...editTask, priority: value })
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
                      <div className="space-y-2">
                        <Label>Date d'échéance</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !editTask.due_date && "text-muted-foreground"
                              )}
                              type="button"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editTask.due_date
                                ? format(editTask.due_date, "PPP", { locale: fr })
                                : "Choisir une date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={editTask.due_date}
                              onSelect={(date) => setEditTask({ ...editTask, due_date: date })}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <TagInput
                          tags={editTask.tags}
                          onChange={(tags) => setEditTask({ ...editTask, tags })}
                          placeholder="Ajouter des tags..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-estimated-hours">Heures estimées</Label>
                        <Input
                          id="edit-estimated-hours"
                          type="number"
                          step="0.5"
                          min="0"
                          value={editTask.estimated_hours}
                          onChange={(e) => setEditTask({ ...editTask, estimated_hours: e.target.value })}
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

          {isProjectManager && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer la tâche
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La tâche "{task.title}" sera définitivement supprimée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-2xl">{task.title}</CardTitle>
                    <CardDescription>
                      Projet: {task.projects?.name || "Non défini"}
                    </CardDescription>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{task.description}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <PriorityBadge priority={task.priority} />
                  {task.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {task.due_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Échéance : {new Date(task.due_date).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select 
                      value={task.status} 
                      onValueChange={handleStatusChange}
                      disabled={task.status === "completed"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">À faire</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                      </SelectContent>
                    </Select>
                    {task.status === "completed" && (
                      <p className="text-xs text-muted-foreground">
                        Le statut ne peut plus être modifié
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Assigné à</Label>
                    <Select
                      value={task.assigned_to || ""}
                      onValueChange={handleAssigneeChange}
                      disabled={!isProjectManager}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Non assigné" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isProjectManager && (
                      <p className="text-xs text-muted-foreground">
                        Seuls les chefs de projet peuvent réassigner
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Heures estimées</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Ex: 8"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                      />
                      <Button size="sm" onClick={handleUpdateEstimatedHours}>
                        OK
                      </Button>
                    </div>
                  </div>
                </div>

                {subtasks.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Sous-tâches ({subtasks.length})
                      </h4>
                      <div className="space-y-2">
                        {subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => navigate(`/tasks/${subtask.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{subtask.title}</span>
                              <Badge variant={subtask.status === "completed" ? "default" : "secondary"}>
                                {subtask.status === "todo" ? "À faire" : subtask.status === "in_progress" ? "En cours" : "Terminée"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Commentaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun commentaire pour le moment
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {comment.profiles.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm ml-10">{comment.content}</p>
                      {comment.attachment_url && (
                        <a
                          href={comment.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-10 flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Download className="h-4 w-4" />
                          {comment.attachment_name || "Pièce jointe"}
                        </a>
                      )}
                      <Separator className="ml-10" />
                    </div>
                  ))
                )}

                <form onSubmit={handleAddComment} className="space-y-3">
                  <Textarea
                    placeholder="Ajouter un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <FileUpload
                    selectedFile={selectedFile}
                    onFileSelect={setSelectedFile}
                    onFileRemove={() => setSelectedFile(null)}
                  />
                  <Button type="submit" size="sm">
                    Envoyer
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Aucune activité
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.profiles.full_name}
                          </span>{" "}
                          {getActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.created_at)}
                        </p>
                        {activity !== activities[activities.length - 1] && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
