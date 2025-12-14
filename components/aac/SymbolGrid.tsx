import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Symbol } from "@/types/symbol";
import { SymbolCard } from "./SymbolCard";

interface SymbolGridProps {
  isStarterSymbols: boolean;
  symbols: Symbol[];
  loading: boolean;
  error: string | null;
  onSymbolClick: (symbol: Symbol) => void;
  onRefresh: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 16 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-center font-medium">
      {message}
    </div>
  );
}

export function SymbolGrid({
  isStarterSymbols,
  symbols,
  loading,
  error,
  onSymbolClick,
  onRefresh,
  showLabels,
  onToggleLabels,
}: SymbolGridProps) {
  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black tracking-tight">Tableau CAA</h1>
        <div className="flex items-center gap-2">
          <Button onClick={onToggleLabels} variant="outline" title={showLabels ? "Masquer le texte" : "Afficher le texte"}>
            {showLabels ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span className="hidden sm:inline">{showLabels ? "Masquer texte" : "Afficher texte"}</span>
          </Button>
          {!isStarterSymbols && <Button onClick={onRefresh} disabled={loading} variant="outline">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Nouveaux Symboles
          </Button>}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <SkeletonGrid />
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {symbols.map((symbol) => (
            <SymbolCard
              key={`${symbol.id}-${symbol.label}`}
              symbol={symbol}
              onClick={() => onSymbolClick(symbol)}
              showLabel={showLabels}
            />
          ))}
        </div>
      )}
    </main>
  );
}
