import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingDown, TrendingUp, PiggyBank, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Expense {
  id: string;
  label: string;
  amount: number;
  category: string;
}

const CATEGORIES = [
  { id: "loyer", label: "🏠 Loyer", color: "bg-warning/15 text-warning" },
  { id: "courses", label: "🛒 Courses", color: "bg-success/15 text-success" },
  { id: "transport", label: "🚌 Transport", color: "bg-info/15 text-info" },
  { id: "loisirs", label: "🎉 Loisirs", color: "bg-primary/15 text-primary" },
  { id: "sante", label: "🏥 Santé", color: "bg-destructive/15 text-destructive" },
  { id: "autre", label: "📦 Autre", color: "bg-muted text-muted-foreground" },
];

const BudgetTracker = () => {
  const { user } = useAuth();
  const [budget, setBudget] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("autre");

  // Load budget from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("budget_monthly")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.budget_monthly) setBudget(data.budget_monthly);
      });

    // Load expenses from localStorage (simple, no DB needed)
    const key = `budget_expenses_${user.id}_${new Date().getFullYear()}_${new Date().getMonth()}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { setExpenses(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [user]);

  // Persist expenses to localStorage
  useEffect(() => {
    if (!user) return;
    const key = `budget_expenses_${user.id}_${new Date().getFullYear()}_${new Date().getMonth()}`;
    localStorage.setItem(key, JSON.stringify(expenses));
  }, [expenses, user]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = budget ? budget - totalSpent : null;
  const percentUsed = budget ? Math.min((totalSpent / budget) * 100, 100) : 0;

  const addExpense = () => {
    const amount = parseFloat(newAmount);
    if (!newLabel.trim() || isNaN(amount) || amount <= 0) return;
    setExpenses((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newLabel.trim(), amount, category: newCategory },
    ]);
    setNewLabel("");
    setNewAmount("");
    setNewCategory("autre");
    setAddOpen(false);
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const saveBudget = async (val: number) => {
    setBudget(val);
    if (user) {
      await supabase.from("profiles").update({ budget_monthly: val }).eq("user_id", user.id);
    }
  };

  // Group by category
  const byCategory = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 p-5 text-left cursor-pointer"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground">Mon budget du mois</h3>
          <p className="text-xs text-muted-foreground">
            {budget
              ? `${totalSpent.toFixed(0)}€ dépensés sur ${budget}€`
              : "Configure ton budget mensuel"}
          </p>
        </div>
        {budget && remaining !== null && (
          <div className={`flex items-center gap-1 text-xs font-bold ${remaining >= 0 ? "text-success" : "text-destructive"}`}>
            {remaining >= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {remaining >= 0 ? `${remaining.toFixed(0)}€ restants` : `${Math.abs(remaining).toFixed(0)}€ de dépassement`}
          </div>
        )}
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Progress bar */}
      {budget && (
        <div className="px-5 pb-3">
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${percentUsed > 90 ? "bg-destructive" : percentUsed > 70 ? "bg-warning" : "bg-success"}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentUsed}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-border/40 px-5 py-4 space-y-3"
        >
          {/* Budget setup */}
          {!budget && (
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Budget mensuel :</span>
              <div className="flex flex-wrap gap-1.5">
                {[400, 600, 800, 1000, 1200].map((v) => (
                  <button
                    key={v}
                    onClick={() => saveBudget(v)}
                    className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/40 cursor-pointer whitespace-nowrap"
                  >
                    {v}€
                  </button>
                ))}
              </div>
            </div>
          )}

          {budget && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <PiggyBank className="h-3.5 w-3.5" />
              <span>Budget : <strong className="text-foreground">{budget}€</strong></span>
              <button onClick={() => setBudget(null)} className="text-primary text-xs hover:underline cursor-pointer ml-1">modifier</button>
            </div>
          )}

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {byCategory.map((cat) => (
                <span key={cat.id} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cat.color}`}>
                  {cat.label.split(" ")[0]} {cat.total.toFixed(0)}€
                </span>
              ))}
            </div>
          )}

          {/* Expense list */}
          {expenses.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
                  <span className="text-xs">{CATEGORIES.find((c) => c.id === e.category)?.label.split(" ")[0]}</span>
                  <span className="flex-1 text-xs font-medium text-foreground truncate">{e.label}</span>
                  <span className="text-xs font-bold text-foreground">{e.amount.toFixed(0)}€</span>
                  <button onClick={() => removeExpense(e.id)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add expense form */}
          {addOpen ? (
            <div className="space-y-2 rounded-2xl border border-border bg-secondary/30 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex : Courses Carrefour"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  maxLength={50}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="€"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  min={0}
                  className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setNewCategory(cat.id)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium border cursor-pointer transition-colors ${
                      newCategory === cat.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={addExpense} className="flex-1 rounded-xl gold-gradient py-2 text-xs font-bold text-primary-foreground cursor-pointer">
                  Ajouter
                </button>
                <button onClick={() => setAddOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs text-muted-foreground cursor-pointer">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une dépense
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default BudgetTracker;
