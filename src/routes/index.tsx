import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { RegisterCutDialog } from "@/components/app/RegisterCutDialog";
import { Card } from "@/components/ui/card";
import { Users, Scissors, DollarSign, Gift, ArrowRight } from "lucide-react";
import { brl } from "@/lib/fidelity";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const [{ count: clientsCount }, { data: cuts }] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("haircuts").select("*").gte("cut_date", start.toISOString()),
      ]);
      const all = cuts ?? [];
      const revenue = all.filter((c) => c.is_paid && !c.is_courtesy).reduce((s, c) => s + Number(c.price), 0);
      const pending = all.filter((c) => !c.is_paid && !c.is_courtesy).reduce((s, c) => s + Number(c.price), 0);
      const courtesy = all.filter((c) => c.is_courtesy).length;
      return {
        clientsCount: clientsCount ?? 0,
        cutsCount: all.length,
        revenue,
        pending,
        courtesy,
      };
    },
  });

  if (loading || !user) return null;

  const stats = data ?? { clientsCount: 0, cutsCount: 0, revenue: 0, pending: 0, courtesy: 0 };
  const monthLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="rounded-3xl bg-gradient-to-br from-primary/15 via-card to-card border border-border p-6 md:p-10 shadow-2xl">
          <p className="text-sm uppercase tracking-widest text-primary/80">Painel · {monthLabel}</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">Olá, vamos cortar?</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            Registre um corte em segundos e mantenha a fidelidade dos seus clientes em dia.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <RegisterCutDialog />
            <Link
              to="/clientes"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-4 py-3 text-sm font-medium hover:bg-accent transition"
            >
              Ver clientes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Clientes" value={stats.clientsCount} />
          <StatCard icon={Scissors} label="Cortes no mês" value={stats.cutsCount} />
          <StatCard icon={DollarSign} label="Faturado" value={brl(stats.revenue)} accent />
          <StatCard icon={Gift} label="Cortesias" value={stats.courtesy} />
        </section>

        <section className="grid md:grid-cols-2 gap-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">A receber este mês</p>
            <p className="font-display text-3xl font-bold mt-1 text-warning">{brl(stats.pending)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Faturamento total do mês</p>
            <p className="font-display text-3xl font-bold mt-1">{brl(stats.revenue + stats.pending)}</p>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card className={`p-4 ${accent ? "bg-primary/10 border-primary/30" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className="font-display text-2xl md:text-3xl font-bold mt-2">{value}</p>
    </Card>
  );
}
