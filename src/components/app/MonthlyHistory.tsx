import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { brl } from "@/lib/fidelity";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, TrendingUp, Gift, CheckCircle2 } from "lucide-react";

export interface MonthSummary {
  monthKey: string;
  label: string;
  shortLabel: string;
  cutsCount: number;
  revenue: number;
  pending: number;
  courtesyCount: number;
  averageTicket: number;
  date: Date;
}

interface MonthlyHistoryProps {
  monthlyData: MonthSummary[];
  onSelectMonth: (date: Date) => void;
}

export function MonthlyHistory({ monthlyData, onSelectMonth }: MonthlyHistoryProps) {
  const chartData = [...monthlyData].reverse();
  const [detailsMonth, setDetailsMonth] = useState<MonthSummary | null>(null);

  return (
    <div className="space-y-6">
      {/* Gráfico de Evolução Mensal */}
      <Card className="p-5 border-border bg-card/90 backdrop-blur-md shadow-xl">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Evolução Mensal de Faturamento & Cortes
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum corte registrado ainda.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -15, bottom: 0 }}
                  barCategoryGap="30%"
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#44403c" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: "#a8a29e", fontSize: 12 }}
                    axisLine={{ stroke: "#44403c" }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(val) => `R$${val}`}
                    tick={{ fill: "#a8a29e", fontSize: 11 }}
                    axisLine={{ stroke: "#44403c" }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#a8a29e", fontSize: 11 }}
                    axisLine={{ stroke: "#44403c" }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === "Faturamento (R$)") return [brl(Number(value)), name];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: "#1c1917",
                      borderColor: "#44403c",
                      borderRadius: "0.75rem",
                      color: "#fafaf9",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "12px", color: "#d6d3d1" }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name="Faturamento (R$)"
                    fill="#f59e0b"
                    maxBarSize={48}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="cutsCount"
                    name="Qtd. Cortes"
                    fill="#38bdf8"
                    maxBarSize={48}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Fechamento de Meses */}
      <Card className="p-5 border-border bg-card/90 shadow-xl">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-amber-500" />
            Histórico Consolidado por Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border">
                  <TableHead className="font-bold">Mês / Ano</TableHead>
                  <TableHead className="text-center font-bold">Cortes</TableHead>
                  <TableHead className="text-center font-bold">Cortesias</TableHead>
                  <TableHead className="text-right font-bold">Ticket Médio</TableHead>
                  <TableHead className="text-right font-bold">A Receber</TableHead>
                  <TableHead className="text-right font-bold text-amber-400">Faturado</TableHead>
                  <TableHead className="text-center font-bold">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Nenhum histórico encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyData.map((m) => (
                    <TableRow key={m.monthKey} className="hover:bg-accent/40 border-border">
                      <TableCell className="font-medium capitalize">{m.label}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {m.cutsCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {m.courtesyCount > 0 ? (
                          <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
                            {m.courtesyCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {brl(m.averageTicket)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-warning">
                        {m.pending > 0 ? brl(m.pending) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm text-amber-400">
                        {brl(m.revenue)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs hover:bg-amber-500/10 hover:text-amber-400"
                          onClick={() => {
                            onSelectMonth(m.date);
                            setDetailsMonth(m);
                          }}
                        >
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MonthDetailsDialog month={detailsMonth} onClose={() => setDetailsMonth(null)} />
    </div>
  );
}

function MonthDetailsDialog({ month, onClose }: { month: MonthSummary | null; onClose: () => void }) {
  const { data: cuts = [], isLoading } = useQuery({
    queryKey: ["month-cuts", month?.monthKey],
    enabled: !!month,
    queryFn: async () => {
      const start = new Date(month!.date.getFullYear(), month!.date.getMonth(), 1);
      const end = new Date(month!.date.getFullYear(), month!.date.getMonth() + 1, 1);
      const { data, error } = await supabase
        .from("haircuts")
        .select("*, clients(name)")
        .gte("cut_date", start.toISOString())
        .lt("cut_date", end.toISOString())
        .order("cut_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={!!month} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl capitalize">{month?.label}</DialogTitle>
        </DialogHeader>

        {month && (
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground uppercase">Cortes</p>
              <p className="font-display text-xl font-bold mt-1">{month.cutsCount}</p>
            </Card>
            <Card className="p-3 bg-primary/10 border-primary/30">
              <p className="text-xs text-muted-foreground uppercase">Faturado</p>
              <p className="font-display text-xl font-bold mt-1">{brl(month.revenue)}</p>
            </Card>
            <Card className="p-3 bg-warning/10 border-warning/30">
              <p className="text-xs text-muted-foreground uppercase">A receber</p>
              <p className="font-display text-xl font-bold mt-1 text-warning">{brl(month.pending)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground uppercase">Cortesias</p>
              <p className="font-display text-xl font-bold mt-1">{month.courtesyCount}</p>
            </Card>
          </div>
        )}

        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>}
          {!isLoading && cuts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum corte neste mês.</p>
          )}
          {cuts.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <div className="flex-1 min-w-0">
                <Link
                  to="/clientes/$id"
                  params={{ id: c.client_id }}
                  className="font-medium hover:text-primary truncate block"
                >
                  {c.clients?.name ?? "Cliente removido"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.cut_date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {!c.is_courtesy && ` · ${brl(Number(c.price))}`}
                </p>
              </div>
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
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
