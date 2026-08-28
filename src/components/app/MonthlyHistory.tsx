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
import { Calendar, TrendingUp } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          {chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum corte registrado ainda.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="shortLabel" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "Faturamento" ? [brl(Number(value)), name] : [value, name]
                    }
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name="Faturamento"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="cutsCount"
                    name="Qtd. cortes"
                    fill="hsl(var(--muted-foreground))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="p-5">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico consolidado por mês
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-xl border border-border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold">Mês / Ano</TableHead>
                  <TableHead className="text-center font-bold">Cortes</TableHead>
                  <TableHead className="text-center font-bold">Cortesias</TableHead>
                  <TableHead className="text-right font-bold">Ticket médio</TableHead>
                  <TableHead className="text-right font-bold">A receber</TableHead>
                  <TableHead className="text-right font-bold text-primary">Faturado</TableHead>
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
                    <TableRow key={m.monthKey} className="hover:bg-accent/40">
                      <TableCell className="font-medium capitalize whitespace-nowrap">{m.label}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{m.cutsCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {m.courtesyCount > 0 ? (
                          <Badge variant="outline">{m.courtesyCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">{brl(m.averageTicket)}</TableCell>
                      <TableCell className="text-right text-sm text-warning">
                        {m.pending > 0 ? brl(m.pending) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">{brl(m.revenue)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => onSelectMonth(m.date)}
                        >
                          Ver
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
    </div>
  );
}
