import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Gift, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { brl, fidelityProgress } from "@/lib/fidelity";

export const Route = createFileRoute("/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — BarberPro" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: cuts = [] } = useQuery({
    queryKey: ["all-cuts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("haircuts").select("*");
      if (error) throw error;
      return data;
    },
  });

  const enriched = useMemo(() => {
    return clients.map((c) => {
      const my = cuts.filter((h) => h.client_id === c.id);
      const fp = fidelityProgress(my);
      const pending = my.filter((h) => !h.is_paid && !h.is_courtesy).reduce((s, h) => s + Number(h.price), 0);
      return { ...c, totalCuts: my.length, fp, pending };
    });
  }, [clients, cuts]);

  const filtered = enriched.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      if (!name.trim()) throw new Error("Informe o nome");
      const { error } = await supabase
        .from("clients")
        .insert({ user_id: user.id, name: name.trim(), phone: phone || null, notes: notes || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente cadastrado!");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setName("");
      setPhone("");
      setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || !user) return null;

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Clientes</h1>
            <p className="text-muted-foreground text-sm mt-1">{clients.length} cadastrado(s)</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Novo cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome completo *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone (WhatsApp)</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" placeholder="(11) 9 9999-9999" />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-11" disabled={create.isPending} onClick={() => create.mutate()}>
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">
              Nenhum cliente {search ? "encontrado" : "cadastrado ainda"}.
            </Card>
          )}
          {filtered.map((c) => (
            <Link
              key={c.id}
              to="/clientes/$id"
              params={{ id: c.id }}
              className="block group"
            >
              <Card className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-accent grid place-items-center font-display font-bold text-lg">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{c.name}</p>
                      {c.fp.eligible && (
                        <span className="inline-flex items-center gap-1 text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">
                          <Gift className="h-3 w-3" /> Cortesia disponível
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 max-w-[160px]">
                        <Progress value={(c.fp.display / c.fp.goal) * 100} className="h-1.5" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {c.fp.display}/{c.fp.goal}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{c.totalCuts} cortes</span>
                      {c.pending > 0 && (
                        <span className="text-xs font-semibold text-warning">{brl(c.pending)} pendente</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
