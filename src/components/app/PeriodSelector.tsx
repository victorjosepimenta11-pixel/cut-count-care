import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export type PeriodType = "today" | "week" | "month" | "last_month" | "year" | "all";

interface PeriodSelectorProps {
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  formattedRange: string;
}

const OPTIONS: { key: PeriodType; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "week", label: "Esta semana" },
  { key: "month", label: "Mês atual" },
  { key: "last_month", label: "Mês anterior" },
  { key: "year", label: "Este ano" },
  { key: "all", label: "Tudo" },
];

export function PeriodSelector({
  period,
  onPeriodChange,
  selectedDate,
  onDateChange,
  formattedRange,
}: PeriodSelectorProps) {
  const shiftMonth = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(1);
    next.setMonth(next.getMonth() + delta);
    onDateChange(next);
    if (period !== "month") onPeriodChange("month");
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/60 p-3 rounded-2xl border border-border">
      <div className="flex flex-wrap items-center gap-1.5">
        {OPTIONS.map((o) => (
          <Button
            key={o.key}
            variant={period === o.key ? "default" : "ghost"}
            size="sm"
            className="text-xs h-9 rounded-lg"
            onClick={() => onPeriodChange(o.key)}
          >
            {o.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-border/50">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0"
          onClick={() => shiftMonth(-1)}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/60 text-xs font-medium whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="capitalize">{formattedRange}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0"
          onClick={() => shiftMonth(1)}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
