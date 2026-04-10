import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ChevronDown, ChevronUp, MapPin, TrendingDown, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  name: string;
  emoji: string;
  prices: { store: string; price: number; unit: string }[];
}

const PRODUCTS_DATA: Record<string, Product[]> = {
  grenoble: [
    {
      name: "Pâtes 500g",
      emoji: "🍝",
      prices: [
        { store: "Lidl Grenoble", price: 0.69, unit: "500g" },
        { store: "Carrefour City", price: 1.15, unit: "500g" },
        { store: "Aldi Saint-Martin", price: 0.72, unit: "500g" },
      ],
    },
    {
      name: "Lait 1L",
      emoji: "🥛",
      prices: [
        { store: "Lidl Grenoble", price: 0.89, unit: "1L" },
        { store: "Carrefour City", price: 1.05, unit: "1L" },
        { store: "Aldi Saint-Martin", price: 0.85, unit: "1L" },
      ],
    },
    {
      name: "Riz 1kg",
      emoji: "🍚",
      prices: [
        { store: "Lidl Grenoble", price: 1.29, unit: "1kg" },
        { store: "Carrefour City", price: 1.89, unit: "1kg" },
        { store: "Aldi Saint-Martin", price: 1.35, unit: "1kg" },
      ],
    },
    {
      name: "Œufs x10",
      emoji: "🥚",
      prices: [
        { store: "Lidl Grenoble", price: 1.99, unit: "x10" },
        { store: "Carrefour City", price: 2.79, unit: "x10" },
        { store: "Aldi Saint-Martin", price: 2.09, unit: "x10" },
      ],
    },
    {
      name: "Pain de mie",
      emoji: "🍞",
      prices: [
        { store: "Lidl Grenoble", price: 0.99, unit: "500g" },
        { store: "Carrefour City", price: 1.49, unit: "500g" },
        { store: "Aldi Saint-Martin", price: 1.05, unit: "500g" },
      ],
    },
  ],
  paris: [
    {
      name: "Pâtes 500g",
      emoji: "🍝",
      prices: [
        { store: "Lidl Paris", price: 0.75, unit: "500g" },
        { store: "Franprix", price: 1.35, unit: "500g" },
        { store: "Aldi Paris", price: 0.79, unit: "500g" },
      ],
    },
    {
      name: "Lait 1L",
      emoji: "🥛",
      prices: [
        { store: "Lidl Paris", price: 0.95, unit: "1L" },
        { store: "Franprix", price: 1.25, unit: "1L" },
        { store: "Aldi Paris", price: 0.92, unit: "1L" },
      ],
    },
    {
      name: "Riz 1kg",
      emoji: "🍚",
      prices: [
        { store: "Lidl Paris", price: 1.39, unit: "1kg" },
        { store: "Franprix", price: 2.15, unit: "1kg" },
        { store: "Aldi Paris", price: 1.45, unit: "1kg" },
      ],
    },
    {
      name: "Œufs x10",
      emoji: "🥚",
      prices: [
        { store: "Lidl Paris", price: 2.19, unit: "x10" },
        { store: "Franprix", price: 3.29, unit: "x10" },
        { store: "Aldi Paris", price: 2.25, unit: "x10" },
      ],
    },
    {
      name: "Pain de mie",
      emoji: "🍞",
      prices: [
        { store: "Lidl Paris", price: 1.09, unit: "500g" },
        { store: "Franprix", price: 1.79, unit: "500g" },
        { store: "Aldi Paris", price: 1.15, unit: "500g" },
      ],
    },
  ],
  nice: [
    {
      name: "Pâtes 500g",
      emoji: "🍝",
      prices: [
        { store: "Lidl Nice", price: 0.72, unit: "500g" },
        { store: "Casino Nice", price: 1.25, unit: "500g" },
        { store: "Aldi Nice", price: 0.75, unit: "500g" },
      ],
    },
    {
      name: "Lait 1L",
      emoji: "🥛",
      prices: [
        { store: "Lidl Nice", price: 0.92, unit: "1L" },
        { store: "Casino Nice", price: 1.15, unit: "1L" },
        { store: "Aldi Nice", price: 0.88, unit: "1L" },
      ],
    },
    {
      name: "Riz 1kg",
      emoji: "🍚",
      prices: [
        { store: "Lidl Nice", price: 1.35, unit: "1kg" },
        { store: "Casino Nice", price: 1.99, unit: "1kg" },
        { store: "Aldi Nice", price: 1.39, unit: "1kg" },
      ],
    },
    {
      name: "Œufs x10",
      emoji: "🥚",
      prices: [
        { store: "Lidl Nice", price: 2.09, unit: "x10" },
        { store: "Casino Nice", price: 2.99, unit: "x10" },
        { store: "Aldi Nice", price: 2.15, unit: "x10" },
      ],
    },
    {
      name: "Pain de mie",
      emoji: "🍞",
      prices: [
        { store: "Lidl Nice", price: 1.05, unit: "500g" },
        { store: "Casino Nice", price: 1.59, unit: "500g" },
        { store: "Aldi Nice", price: 1.09, unit: "500g" },
      ],
    },
  ],
};

// Default fallback for other cities
const DEFAULT_PRODUCTS: Product[] = PRODUCTS_DATA.grenoble;

const ComparateurCourses = () => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("city")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setUserCity(data?.city ?? null));
  }, [user?.id]);

  const cityKey = userCity?.toLowerCase().trim() || "";
  const products = PRODUCTS_DATA[cityKey] || DEFAULT_PRODUCTS;
  const displayCity = userCity || "ta ville";

  // Find cheapest store overall
  const storeTotals = new Map<string, number>();
  products.forEach((p) => {
    p.prices.forEach(({ store, price }) => {
      storeTotals.set(store, (storeTotals.get(store) || 0) + price);
    });
  });
  const cheapestStore = [...storeTotals.entries()].sort((a, b) => a[1] - b[1])[0];

  const visibleProducts = expanded ? products : products.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-border bg-card p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-success/15">
          <ShoppingCart className="h-5 w-5 text-success" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">Comparateur Courses 🛒</h3>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Produits essentiels à {displayCity}</span>
          </div>
        </div>
      </div>

      {/* Cheapest store highlight */}
      {cheapestStore && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-success/20 bg-success/5 px-3 py-2">
          <Star className="h-4 w-4 text-success fill-success" />
          <p className="text-xs text-foreground">
            <span className="font-bold">{cheapestStore[0]}</span>{" "}
            <span className="text-muted-foreground">
              est le moins cher en moyenne ({cheapestStore[1].toFixed(2)}€ le panier)
            </span>
          </p>
        </div>
      )}

      {/* Products list */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {visibleProducts.map((product, i) => {
            const sorted = [...product.prices].sort((a, b) => a.price - b.price);
            const cheapest = sorted[0].price;
            const mostExpensive = sorted[sorted.length - 1].price;
            const savings = ((mostExpensive - cheapest) / mostExpensive * 100).toFixed(0);

            return (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="rounded-2xl border border-border/60 bg-secondary/30 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    {product.emoji} {product.name}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                    <TrendingDown className="h-3 w-3" />
                    -{savings}%
                  </span>
                </div>
                <div className="space-y-1">
                  {sorted.map((p, j) => (
                    <div
                      key={p.store}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs ${
                        j === 0
                          ? "bg-success/10 font-bold text-success"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span>{p.store}</span>
                      <span className="font-mono">{p.price.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Expand/collapse */}
      {products.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl border border-border py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
        >
          {expanded ? (
            <>Voir moins <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Voir {products.length - 3} autres produits <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        💡 Prix indicatifs — mis à jour régulièrement
      </p>
    </motion.div>
  );
};

export default ComparateurCourses;
