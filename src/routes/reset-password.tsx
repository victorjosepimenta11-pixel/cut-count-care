import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — BarberPro" },
      { name: "description", content: "Defina uma nova senha para sua conta BarberPro." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash automatically and emits a PASSWORD_RECOVERY event
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const updatePassword = async () => {
    if (password.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não conferem.");
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Senha alterada com sucesso!");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-xl shadow-primary/30 mb-4">
            <Scissors className="h-7 w-7" />
          </div>
          <h1 className="font-display text-4xl font-bold">Nova senha</h1>
          <p className="text-muted-foreground mt-2">Defina uma nova senha para sua conta.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
          {!ready ? (
            <p className="text-sm text-muted-foreground text-center">
              Abra esta página pelo link enviado ao seu e-mail.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar senha</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
              </div>
              <Button className="w-full h-11" disabled={submitting} onClick={updatePassword}>
                Salvar nova senha
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}