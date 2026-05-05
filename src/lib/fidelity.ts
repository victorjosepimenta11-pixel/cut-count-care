import type { Tables } from "@/integrations/supabase/types";

export const FIDELITY_GOAL = 10;

export type Haircut = Tables<"haircuts">;

/**
 * Counts paid (non-courtesy) cuts since the most recent courtesy cut.
 * Returns progress toward the next free cut.
 */
export function fidelityProgress(haircuts: Haircut[]) {
  const sorted = [...haircuts].sort(
    (a, b) => new Date(a.cut_date).getTime() - new Date(b.cut_date).getTime(),
  );
  let count = 0;
  for (const h of sorted) {
    if (h.is_courtesy) count = 0;
    else count += 1;
  }
  const eligible = count >= FIDELITY_GOAL;
  const display = eligible ? FIDELITY_GOAL : count;
  return { count, display, eligible, goal: FIDELITY_GOAL };
}

export function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
