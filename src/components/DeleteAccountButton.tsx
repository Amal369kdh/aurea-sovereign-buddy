import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DeleteAccountButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (!user || confirmText !== "SUPPRIMER") return;
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Erreur", description: "Session expirée, reconnecte-toi.", variant: "destructive" });
        setDeleting(false);
        return;
      }

      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error || res.data?.error) {
        toast({
          title: "Erreur",
          description: res.data?.error || "Impossible de supprimer le compte.",
          variant: "destructive",
        });
        setDeleting(false);
        return;
      }

      // Sign out locally and redirect
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Supprimer mon compte
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer définitivement ton compte ?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>Cette action est <strong>irréversible</strong>. Toutes tes données seront supprimées :</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Profil et progression</li>
              <li>Messages et conversations</li>
              <li>Annonces, commentaires et likes</li>
              <li>Profil rencontres et matchs</li>
              <li>Vérification étudiante</li>
            </ul>
            <p className="text-sm">
              Tu pourras te réinscrire avec le même email après la suppression.
            </p>
            <div className="pt-2">
              <label className="text-xs font-medium text-foreground">
                Tape <span className="font-bold text-destructive">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmText !== "SUPPRIMER" || deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Supprimer définitivement"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountButton;
