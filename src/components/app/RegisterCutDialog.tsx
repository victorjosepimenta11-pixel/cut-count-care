import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Scissors, Gift } from "lucide-react";
import { toast } from "sonner";
import { fidelityProgress, brl } from "@/lib/fidelity";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

export function RegisterCutDialog({
  trigger,
  defaultClientId,
}: {
  trigger?: React.ReactNode;
  defaultClientId?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string | undefined>(defaultClientId);
  const [price, setPrice] = useState("40");
  const [paid, setPaid] = useState(true);
  const [courtesy, setCourtesy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: clientCuts = [] } = useQuery({
    queryKey: ["client-cuts", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("haircuts")
        .select("*")
        .eq("client_id", clientId!)
        .order("cut_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const progress = fidelityProgress(clientCuts);
  const selected = clients.find((c) => c.id === clientId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !clientId) throw new Error("Selecione um cliente");
      const { error } = await supabase.from("haircuts").insert({
        user_id: user.id,
        client_id: clientId,
        price: courtesy ? 0 : Number(price.replace(",", ".")) || 0,
        is_courtesy: courtesy,
        is_paid: courtesy ? true : paid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(courtesy ? "Cortesia registrada! 🎁" : "Corte registrado!");
      qc.invalidateQueries();
      setOpen(false);
      setCourtesy(false);
      setPaid(true);
      setPrice("40");
      if (!defaultClientId) setClientId(undefined);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="gap-2">
            <Scissors className="h-5 w-5" /> Registrar corte
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Novo corte</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!defaultClientId && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between h-12">
                    {selected ? selected.name : "Selecione um cliente"}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setClientId(c.id);
                              setPickerOpen(false);
                            }}
                          >
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {clientId && (
            <div className="rounded-lg bg-accent/40 p-3 text-sm">
              {progress.eligible ? (
                <p className="flex items-center gap-2 text-warning">
                  <Gift className="h-4 w-4" /> Este cliente atingiu {progress.goal} cortes — ofereça uma cortesia!
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Progresso de fidelidade: <span className="text-foreground font-semibold">{progress.display}/{progress.goal}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-base">Cortesia</Label>
              <p className="text-xs text-muted-foreground">Corte gratuito de fidelidade</p>
            </div>
            <Switch checked={courtesy} onCheckedChange={setCourtesy} />
          </div>

          {!courtesy && (
            <>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="text-base">Já foi pago</Label>
                  <p className="text-xs text-muted-foreground">{paid ? "Pago" : `Pendente · ${brl(Number(price.replace(",", ".")) || 0)}`}</p>
                </div>
                <Switch checked={paid} onCheckedChange={setPaid} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            size="lg"
            className="w-full h-12 text-base"
            disabled={!clientId || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Scissors className="h-5 w-5 mr-2" />
            Registrar corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
