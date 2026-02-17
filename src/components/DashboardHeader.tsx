import { MapPin, ShieldCheck } from "lucide-react";

const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between px-6 py-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="gold-text">Aurea</span>{" "}
          <span className="text-foreground">Student</span>
        </h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>Grenoble, France</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
          <ShieldCheck className="h-4 w-4" />
          Témoin vérifié
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full gold-gradient text-sm font-bold text-primary-foreground">
          AS
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
