import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RegisterCutDialog } from "@/components/app/RegisterCutDialog";
import { ArrowLeft, Phone, Gift, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { brl, fidelityProgress } from "@/lib/fidelity";

export const Route = createFileRoute("/clientes/$id")({
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: client } = useQuery({
    queryKey: ["client", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: cuts = [] } = useQuery({
    queryKey: ["client-cuts", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("haircuts")
        .select("*")
        .eq("client_id", id)
        .order("cut_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const togglePaid = useMutation({
    mutationFn: async ({ cutId, paid }: { cutId: string; paid: boolean }) => {
      const { error } = await supabase.from("haircuts").update({ is_paid: paid }).eq("id", cutId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });

  const removeCut = useMutation({
    mutationFn: async (cutId: string) => {
      const { error } = await supabase.from("haircuts").delete().eq("id", cutId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Corte removido");
      qc.invalidateQueries();
    },
  });

  const removeClient = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente removido");
      navigate({ to: "/clientes" });
    },
  });

  if (loading || !user || !client) return null;

  const fp = fidelityProgress(cuts);
  const totalSpent = cuts.filter((c) => c.is_paid && !c.is_courtesy).reduce((s, c) => s + Number(c.price), 0);
  const pending = cuts.filter((c) => !c.is_paid && !c.is_courtesy).reduce((s, c) => s + Number(c.price), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/clientes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-card border-primary/20">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold text-2xl shadow-lg shadow-primary/30">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold">{client.name}</h1>
              {client.phone && (
                <a
                  href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mt-1"
                >
                  <Phone className="h-4 w-4" /> {client.phone}
                </a>
              )}
              {client.notes && <p className="text-sm text-muted-foreground mt-2">{client.notes}</p>}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Fidelidade</span>
              <span className="font-semibold">
                {fp.display}/{fp.goal} cortes
              </span>
            </div>
            <Progress value={(fp.display / fp.goal) * 100} className="h-2" />
            {fp.eligible && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm bg-warning/20 text-warning px-3 py-1.5 rounded-full">
                <Gift className="h-4 w-4" /> Cliente ganhou um corte cortesia!
              </p>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Total cortes</p>
            <p className="font-display text-2xl font-bold mt-1">{cuts.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Pago</p>
            <p className="font-display text-2xl font-bold mt-1">{brl(totalSpent)}</p>
          </Card>
          <Card className="p-4 bg-warning/10 border-warning/30">
            <p className="text-xs text-muted-foreground uppercase">Pendente</p>
            <p className="font-display text-2xl font-bold mt-1 text-warning">{brl(pending)}</p>
          </Card>
        </div>

        <RegisterCutDialog
          defaultClientId={id}
          trigger={<Button size="lg" className="w-full h-14 text-base">Registrar corte para {client.name.split(" ")[0]}</Button>}
        />

        <div>
          <h2 className="font-display text-xl font-bold mb-3">Histórico</h2>
          <div className="space-y-2">
            {cuts.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum corte ainda.</Card>
            )}
            {cuts.map((c) => (
              <Card key={c.id} className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">
                      {new Date(c.cut_date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {c.is_courtesy ? (
                      <Badge className="bg-warning/20 text-warning border-warning/40 hover:bg-warning/20">
                        <Gift className="h-3 w-3 mr-1" /> Cortesia
                      </Badge>
                    ) : c.is_paid ? (
                      <Badge className="bg-success/20 text-success border-success/40 hover:bg-success/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Pago
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-warning/40 text-warning">
                        Pendente
                      </Badge>
                    )}
                  </div>
                  {!c.is_courtesy && (
                    <p className="text-sm text-muted-foreground mt-1">{brl(Number(c.price))}</p>
                  )}
                </div>
                {!c.is_courtesy && !c.is_paid && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePaid.mutate({ cutId: c.id, paid: true })}
                  >
                    Marcar pago
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Remover este corte?")) removeCut.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Remover este cliente e todo o seu histórico?")) removeClient.mutate();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Excluir cliente
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
