import { motion } from "framer-motion";
import {
  FileText,
  Home,
  CreditCard,
  Shield,
  Camera,
  GraduationCap,
  Plane,
  ScrollText,
} from "lucide-react";
import { useIntegration } from "@/contexts/IntegrationContext";

const iconMap: Record<string, React.ElementType> = {
  passeport: Plane,
  admission: GraduationCap,
  bail: Home,
  rib: CreditCard,
  assurance: Shield,
  "acte-naissance": ScrollText,
  "photo-id": Camera,
  "certificat-scolarite": FileText,
};

const AlphaVault = () => {
  const { documents, toggleDocument } = useIntegration();
  const ownedCount = documents.filter((d) => d.owned).length;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Alpha Vault</h2>
          <p className="text-sm text-muted-foreground">Gère tes documents essentiels</p>
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          {ownedCount}/{documents.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {documents.map((doc, i) => {
          const Icon = iconMap[doc.id] || FileText;
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => toggleDocument(doc.id)}
              className={`group flex items-center gap-4 rounded-3xl border p-4 cursor-pointer transition-all ${
                doc.owned
                  ? "border-success/30 bg-success/5 hover:bg-success/10"
                  : "border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                  doc.owned
                    ? "bg-success/15 text-success"
                    : "bg-orange-500/15 text-orange-400"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                <p className={`text-xs font-medium ${doc.owned ? "text-success" : "text-orange-400"}`}>
                  {doc.owned ? "✓ En possession" : "⚠ Manquant"}
                </p>
              </div>
              <motion.div
                animate={doc.owned ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                  doc.owned
                    ? "gold-gradient text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {doc.owned ? "✓" : "—"}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AlphaVault;
