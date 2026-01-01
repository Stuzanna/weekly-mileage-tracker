import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Dashboard } from "@/components/Dashboard";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, isPasswordRecovery } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to auth page if not logged in OR if in password recovery mode
    if (!loading && (!user || isPasswordRecovery)) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, isPasswordRecovery, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || isPasswordRecovery) {
    return null;
  }

  return <Dashboard />;
};

export default Index;
