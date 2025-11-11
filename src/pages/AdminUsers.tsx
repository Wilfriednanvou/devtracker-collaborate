import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, UserCheck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface UserWithRole {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  user_roles: {
    role: "project_manager" | "member";
  }[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { isProjectManager, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!roleLoading && !isProjectManager) {
      toast({
        title: "Accès refusé",
        description: "Seuls les chefs de projet peuvent accéder à cette page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isProjectManager, roleLoading, navigate]);

  useEffect(() => {
    if (isProjectManager) {
      fetchUsers();
    }
  }, [isProjectManager]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        created_at,
        user_roles(role)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: "project_manager" | "member") => {
    // Delete existing role
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle",
        variant: "destructive",
      });
      return;
    }

    // Insert new role
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (insertError) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Rôle modifié",
      description: `L'utilisateur est maintenant ${
        newRole === "project_manager" ? "chef de projet" : "membre"
      }`,
    });

    fetchUsers();
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isProjectManager) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h2>
          </div>
          <p className="text-muted-foreground">
            Gérez les rôles et permissions des membres de l'équipe
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
              {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré
              {users.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle actuel</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const currentRole = user.user_roles[0]?.role || "member";
                  const isManager = currentRole === "project_manager";

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {isManager ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            <Crown className="h-3 w-3 mr-1" />
                            Chef de projet
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Membre
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right">
                        {isManager ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Rétrograder
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Rétrograder en membre ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {user.full_name} perdra ses droits de chef de projet et
                                  ne pourra plus gérer les utilisateurs.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRoleChange(user.id, "member")}
                                >
                                  Confirmer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm">
                                <Crown className="h-4 w-4 mr-2" />
                                Promouvoir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Promouvoir en chef de projet ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {user.full_name} pourra créer des projets, gérer les
                                  utilisateurs et leurs rôles.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRoleChange(user.id, "project_manager")
                                  }
                                >
                                  Confirmer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
