import React from react;
import { Button } from @/components/ui/button;
import { ChevronLeft, ChevronRight, Calendar } from lucide-react;

export type PeriodType = today | week | month | last_month | year | all;

interface PeriodSelectorProps {
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  formattedRange: string;
}

export function PeriodSelector({
  period,
  onPeriodChange,
  selectedDate,
  onDateChange,
  formattedRange,
}: PeriodSelectorProps) {
  const handlePrevMonth = () => {
    const next = new Date(selectedDate);
    next.setMonth(next.getMonth() - 1);
    onDateChange(next);
    if (period !== month) {
      onPeriodChange(month);
    }
  };

  const handleNextMonth = () => {
    const next = new Date(selectedDate);
    next.setMonth(next.getMonth() + 1);
    onDateChange(next);
    if (period !== month) {
      onPeriodChange(month);
    }
  };

  return (
    <div className=flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/60 p-3 rounded-2xl border border-border>
      {/* Botões de Período Rápido */}
      <div className=flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0>
        <Button
          variant={period === today ? default : ghost}
          size=sm
          className=text-xs h-8 rounded-lg
          onClick={() => onPeriodChange(today)}
        >
          Hoje
        </Button>
        <Button
          variant={period === week ? default : ghost}
          size=sm
          className=text-xs h-8 rounded-lg
          onClick={() => onPeriodChange(week)}
        >
          Esta semana
        </Button>
        <Button
          variant={period === month ? default : ghost}
          size=sm
          className=text-xs h-8 rounded-lg
          onClick={() => onPeriodChange(month)}
        >
          Mês atual
        </Button>
        <Button
          variant={period === last_month ? default : ghost}
          size=sm
          className=text-xs h-8 rounded-lg
          onClick={() => onPeriodChange(last_month)}
        >
          Mês anterior
        </Button>
        <Button
          variant={period === year ? default : ghost}
          size=sm
          className=text-xs h-8 rounded-lg
          onClick={() => onPeriodChange(year)}
        >
          Este ano
        </Button>
        <Button
          variant={period === all ? default : ghost}
          size=sm
          className=text-xs h-8 rounded-lg
          onClick={() => onPeriodChange(all)}
        >
          Tudo
        </Button>
      </div>

      {/* Navegador Mês a Mês */}
      <div className=flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-border/50>
        <Button
          variant=outline
          size=icon
          className=h-8 w-8 rounded-lg shrink-0
          onClick={handlePrevMonth}
          title=Mês anterior
        >
          <ChevronLeft className=h-4 w-4 />
        </Button>

        <div className=flex items-center gap-1.5 px-3 py-1 rounded-md bg-accent/60 text-xs font-medium text-foreground whitespace-nowrap>
          <Calendar className=h-3.5 w-3.5 text-primary />
          <span className=capitalize>{formattedRange}</span>
        </div>

        <Button
          variant=outline
          size=icon
          className=h-8 w-8 rounded-lg shrink-0
          onClick={handleNextMonth}
          title=Próximo mês
        >
          <ChevronRight className=h-4 w-4 />
        </Button>
      </div>
    </div>
  );
}
