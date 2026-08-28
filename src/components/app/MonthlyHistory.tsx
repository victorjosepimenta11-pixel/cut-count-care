import React from react;
import { Card, CardHeader, CardTitle, CardContent } from @/components/ui/card;
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from recharts;
import { brl } from @/lib/fidelity;
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from @/components/ui/table;
import { Badge } from @/components/ui/badge;
import { Button } from @/components/ui/button;
import { Calendar, TrendingUp, Scissors, DollarSign } from lucide-react;

export interface MonthSummary {
  monthKey: string; // 2026-02
  label: string; // Fevereiro / 2026
  shortLabel: string; // Fev/26
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
    <div className=space-y-6>
      {/* Gráfico de Evolução Mensal */}
      <Card className=p-5>
        <CardHeader className=p-0 pb-4>
          <div className=flex items-center justify-between>
            <CardTitle className=text-lg font-bold flex items-center gap-2>
              <TrendingUp className=h-5 w-5 text-primary />
              Evolução Mensal de Faturamento & Cortes
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className=p-0 pt-2>
          {chartData.length === 0 ? (
            <div className=h-64 flex items-center justify-center text-muted-foreground text-sm>
              Nenhum corte registrado ainda.
            </div>
          ) : (
            <div className=h-72 w-full>
              <ResponsiveContainer width=100% height=100%>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray=3 3 opacity={0.15} />
                  <XAxis dataKey=shortLabel tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId=left
                    orientation=left
                    tickFormatter={(val) => R{val}}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId=right
                    orientation=right
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === Faturamento) return [brl(Number(value)), name];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: hsl(var(--card)),
                      borderColor: hsl(var(--border)),
                      borderRadius: 0.75rem,
                      fontSize: 12px,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12px, paddingTop: 10px }} />
                  <Bar
                    yAxisId=left
                    dataKey=revenue
                    name=Faturamento
                    fill=hsl(var(--primary))
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId=right
                    dataKey=cutsCount
                    name=Qtd. Cortes
                    fill=#38bdf8
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Fechamento de Meses */}
      <Card className=p-5>
        <CardHeader className=p-0 pb-4>
          <CardTitle className=text-lg font-bold flex items-center gap-2>
            <Calendar className=h-5 w-5 text-primary />
            Histórico Consolidado por Mês
          </CardTitle>
        </CardHeader>
        <CardContent className=p-0>
          <div className=rounded-xl border border-border overflow-hidden>
            <Table>
              <TableHeader className=bg-muted/40>
                <TableRow>
                  <TableHead className=font-bold>Mês / Ano</TableHead>
                  <TableHead className=text-center font-bold>Cortes</TableHead>
                  <TableHead className=text-center font-bold>Cortesias</TableHead>
                  <TableHead className=text-right font-bold>Ticket Médio</TableHead>
                  <TableHead className=text-right font-bold>A Receber</TableHead>
                  <TableHead className=text-right font-bold text-primary>Faturado</TableHead>
                  <TableHead className=text-center font-bold>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className=text-center py-6 text-muted-foreground>
                      Nenhum histórico encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyData.map((m) => (
                    <TableRow key={m.monthKey} className=hover:bg-accent/40>
                      <TableCell className=font-medium capitalize>{m.label}</TableCell>
                      <TableCell className=text-center>
                        <Badge variant=secondary className=font-mono>
                          {m.cutsCount}
                        </Badge>
                      </TableCell>
                      <TableCell className=text-center>
                        {m.courtesyCount > 0 ? (
                          <Badge variant=outline className=text-xs text-amber-500 border-amber-500/30>
                            {m.courtesyCount}
                          </Badge>
                        ) : (
                          <span className=text-muted-foreground text-xs>-</span>
                        )}
                      </TableCell>
                      <TableCell className=text-right font-mono text-sm>
                        {brl(m.averageTicket)}
                      </TableCell>
                      <TableCell className=text-right font-mono text-sm text-warning>
                        {m.pending > 0 ? brl(m.pending) : -}
                      </TableCell>
                      <TableCell className=text-right font-mono font-bold text-sm text-primary>
                        {brl(m.revenue)}
                      </TableCell>
                      <TableCell className=text-center>
                        <Button
                          variant=ghost
                          size=sm
                          className=h-7 text-xs
                          onClick={() => onSelectMonth(m.date)}
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
    </div>
  );
}
