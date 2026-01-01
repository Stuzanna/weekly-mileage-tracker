import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Users, Shield, ShieldCheck, ArrowUpDown, ArrowUp, ArrowDown, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { InviteUserDialog } from "@/components/InviteUserDialog";
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

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
}

type SortColumn = 'email' | 'role' | 'created_at' | 'last_sign_in_at';
type SortDirection = 'asc' | 'desc';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  const handleDeleteUser = async (userId: string, email: string) => {
    setDeletingUser(userId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error("No valid session");
        return;
      }

      const response = await supabase.functions.invoke("admin-delete-user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { userId },
      });

      if (response.error || response.data?.error) {
        toast.error(response.error?.message || response.data?.error || "Failed to delete user");
        return;
      }

      toast.success(`User ${email} deleted successfully`);
      fetchUsers();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to delete user");
    } finally {
      setDeletingUser(null);
    }
  };

  const handleResendInvite = async (email: string) => {
    setResendingInvite(email);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error("No valid session");
        return;
      }

      const response = await supabase.functions.invoke("admin-invite-user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { email },
      });

      if (response.error || response.data?.error) {
        toast.error(response.error?.message || response.data?.error || "Failed to resend invite");
        return;
      }

      toast.success(`Invitation resent to ${email}`);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to resend invite");
    } finally {
      setResendingInvite(null);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" /> 
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aVal: string | null = a[sortColumn];
    let bVal: string | null = b[sortColumn];
    
    if (aVal === null) return sortDirection === 'asc' ? 1 : -1;
    if (bVal === null) return sortDirection === 'asc' ? -1 : 1;
    
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin || adminLoading) return;

    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError("No valid session");
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke("admin-list-users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.error) {
        console.error("Error fetching users:", response.error);
        setError(response.error.message || "Failed to fetch users");
      } else if (response.data?.users) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (isAdmin && !adminLoading) {
      fetchUsers();
    }
  }, [isAdmin, adminLoading, fetchUsers]);

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-glow">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="p-2 rounded-lg bg-gradient-coral shadow-coral">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage users and roles
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </Badge>
              <InviteUserDialog onUserInvited={fetchUsers} />
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-display font-bold">
                  {users.length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="text-2xl font-display font-bold">
                  {users.filter((u) => u.role === "admin").length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Regular Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-2xl font-display font-bold">
                  {users.filter((u) => u.role === "user").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Users</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-destructive">{error}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          Email {getSortIcon('email')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center">
                          Role {getSortIcon('role')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center">
                          Created {getSortIcon('created_at')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('last_sign_in_at')}
                      >
                        <div className="flex items-center">
                          Last Sign In {getSortIcon('last_sign_in_at')}
                        </div>
                      </TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell className="font-medium">
                          {userData.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              userData.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {userData.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(userData.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {userData.last_sign_in_at
                            ? format(
                                new Date(userData.last_sign_in_at),
                                "MMM d, yyyy h:mm a"
                              )
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!userData.last_sign_in_at && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvite(userData.email)}
                                disabled={resendingInvite === userData.email}
                                className="gap-1"
                              >
                                {resendingInvite === userData.email ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RotateCw className="w-3 h-3" />
                                )}
                                Resend
                              </Button>
                            )}
                            {userData.id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={deletingUser === userData.id}
                                  >
                                    {deletingUser === userData.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete <strong>{userData.email}</strong>? This action cannot be undone and will permanently remove the user and all their data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(userData.id, userData.email)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
