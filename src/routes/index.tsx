import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { RegisterCutDialog } from "@/components/app/RegisterCutDialog";
import { PeriodSelector, type PeriodType } from "@/components/app/PeriodSelector";
import { MonthlyHistory, type MonthSummary } from "@/components/app/MonthlyHistory";
import { Card } from "@/components/ui/card";
import { Users, Scissors, DollarSign, Gift, ArrowRight } from "lucide-react";
import { brl } from "@/lib/fidelity";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Painel do Barbeiro | Cortes, Fidelidade e Caixa" },
      {
        name: "description",
        content:
          "Acompanhe cortes do mês, faturamento, valores a receber e cortesias de fidelidade da sua barbearia em um só painel.",
      },
      { property: "og:title", content: "Painel do Barbeiro | Cortes, Fidelidade e Caixa" },
      {
        property: "og:description",
        content: "Controle de clientes, fidelidade e pagamentos da sua barbearia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Haircut = {
  id: string;
  cut_date: string;
  price: number | string;
  is_paid: boolean;
  is_courtesy: boolean;
};

function getRange(period: PeriodType, selectedDate: Date) {
  const base = new Date(selectedDate);
  const start = new Date(base);
  const end = new Date(base);

  if (period === "today") {
    const now = new Date();
    start.setTime(now.getTime());
    end.setTime(now.getTime());
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    const now = new Date();
    const day = now.getDay();
    start.setTime(now.getTime());
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === "month" || period === "last_month") {
    if (period === "last_month") base.setMonth(base.getMonth() - 1);
    start.setTime(base.getTime());
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setMonth(start.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "year") {
    start.setTime(new Date(base.getFullYear(), 0, 1).getTime());
    end.setTime(new Date(base.getFullYear(), 11, 31, 23, 59, 59, 999).getTime());
  } else {
    start.setTime(new Date(2000, 0, 1).getTime());
    end.setTime(new Date(2100, 0, 1).getTime());
  }

  return { start, end };
}

function formatRange(period: PeriodType, start: Date, end: Date) {
  if (period === "today") return start.toLocaleDateString("pt-BR");
  if (period === "week")
    return `${start.toLocaleDateString("pt-BR")} - ${end.toLocaleDateString("pt-BR")}`;
  if (period === "year") return String(start.getFullYear());
  if (period === "all") return "Todo o período";
  return start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { start, end } = useMemo(() => getRange(period, selectedDate), [period, selectedDate]);

  const { data: clientsCount } = useQuery({
    queryKey: ["clients-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("clients").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: allCuts } = useQuery({
    queryKey: ["all-haircuts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("haircuts").select("*").order("cut_date", { ascending: false });
      return (data ?? []) as Haircut[];
    },
  });

  const cuts = useMemo(() => {
    return (allCuts ?? []).filter((c) => {
      const d = new Date(c.cut_date);
      return d >= start && d <= end;
    });
  }, [allCuts, start, end]);

  const stats = useMemo(() => {
    const revenue = cuts
      .filter((c) => c.is_paid && !c.is_courtesy)
      .reduce((s, c) => s + Number(c.price), 0);
    const pending = cuts
      .filter((c) => !c.is_paid && !c.is_courtesy)
      .reduce((s, c) => s + Number(c.price), 0);
    return {
      cutsCount: cuts.length,
      revenue,
      pending,
      courtesy: cuts.filter((c) => c.is_courtesy).length,
    };
  }, [cuts]);

  const monthlyData = useMemo<MonthSummary[]>(() => {
    const map = new Map<string, MonthSummary>();
    for (const c of allCuts ?? []) {
      const d = new Date(c.cut_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) {
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        map.set(key, {
          monthKey: key,
          label: first.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
          shortLabel: first.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
          cutsCount: 0,
          revenue: 0,
          pending: 0,
          courtesyCount: 0,
          averageTicket: 0,
          date: first,
        });
      }
      const m = map.get(key)!;
      m.cutsCount += 1;
      if (c.is_courtesy) m.courtesyCount += 1;
      else if (c.is_paid) m.revenue += Number(c.price);
      else m.pending += Number(c.price);
    }
    const list = Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    for (const m of list) {
      const paidCount = m.cutsCount - m.courtesyCount;
      m.averageTicket = paidCount > 0 ? (m.revenue + m.pending) / paidCount : 0;
    }
    return list;
  }, [allCuts]);

  if (loading || !user) return null;

  const rangeLabel = formatRange(period, start, end);

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="rounded-3xl bg-gradient-to-br from-primary/15 via-card to-card border border-border p-6 md:p-10 shadow-2xl">
          <p className="text-sm uppercase tracking-widest text-primary/80">Painel · {rangeLabel}</p>
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

        <PeriodSelector
          period={period}
          onPeriodChange={setPeriod}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          formattedRange={rangeLabel}
        />

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Clientes" value={clientsCount ?? 0} />
          <StatCard icon={Scissors} label="Cortes no período" value={stats.cutsCount} />
          <StatCard icon={DollarSign} label="Faturado" value={brl(stats.revenue)} accent />
          <StatCard icon={Gift} label="Cortesias" value={stats.courtesy} />
        </section>

        <section className="grid md:grid-cols-2 gap-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">A receber no período</p>
            <p className="font-display text-3xl font-bold mt-1 text-warning">{brl(stats.pending)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Total do período</p>
            <p className="font-display text-3xl font-bold mt-1">{brl(stats.revenue + stats.pending)}</p>
          </Card>
        </section>

        <MonthlyHistory
          monthlyData={monthlyData}
          onSelectMonth={(date) => {
            setSelectedDate(date);
            setPeriod("month");
          }}
        />
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
