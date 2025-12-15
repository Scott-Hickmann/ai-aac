import { useState, useMemo } from "react";
import { RefreshCw, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Symbol } from "@/types/symbol";
import { SymbolCard } from "./SymbolCard";
import { cn } from "@/lib/utils";
import Image from "next/image";
import tagIconMapping from "@/lib/tag-icon-mapping.json";
import { getPictogramImageUrl } from "@/lib/pictograms";

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
    <div className="grid grid-cols-6 gap-4">
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

interface CategoryCardProps {
  category: string;
  count: number;
  maxProbability: number;
  iconUrl: string | null;
  showLabel: boolean;
  onClick: () => void;
}

function CategoryCard({ category, count, maxProbability, iconUrl, showLabel, onClick }: CategoryCardProps) {
  const isHighProbability = maxProbability > 0.001;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 border-2 rounded-xl hover:border-primary transition-all duration-200 flex flex-col items-center justify-center gap-2",
        showLabel ? "min-h-[140px]" : "min-h-[100px] aspect-square",
        isHighProbability
          ? "bg-green-50 border-green-500 hover:bg-green-100"
          : "bg-card border-border hover:bg-accent"
      )}
    >
      {iconUrl && (
        <div className={cn(
          "flex items-center justify-center",
          showLabel ? "w-16 h-16" : "w-full h-full"
        )}>
          <Image
            src={iconUrl}
            alt={category}
            width={showLabel ? 64 : 80}
            height={showLabel ? 64 : 80}
            className="object-contain"
            unoptimized
          />
        </div>
      )}
      {showLabel && (
        <>
          <span className="text-sm font-bold text-center capitalize leading-tight">{category}</span>
          <span className="text-xs text-muted-foreground">{count} symbole{count > 1 ? 's' : ''}</span>
        </>
      )}
    </button>
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState<string | null>(null);

  // Group symbols by tags
  const categorizedSymbols = useMemo(() => {
    const categoryMap = new Map<string, Symbol[]>();
    
    symbols.forEach((symbol) => {
      const tags = symbol.pictogram.tags || [];
      if (tags.length === 0) {
        // Add to "Autres" (Other) category if no tags
        const otherSymbols = categoryMap.get("autres") || [];
        categoryMap.set("autres", [...otherSymbols, symbol]);
      } else {
        tags.forEach((tag) => {
          const categorySymbols = categoryMap.get(tag) || [];
          categoryMap.set(tag, [...categorySymbols, symbol]);
        });
      }
    });

    return categoryMap;
  }, [symbols]);

  const sortedCategories = useMemo(() => {
    return Array.from(categorizedSymbols.keys()).sort((a, b) => {
      // Sort "autres" to the end
      if (a === "autres") return 1;
      if (b === "autres") return -1;
      
      // Get sorted probabilities for each category
      const symbolsA = categorizedSymbols.get(a) || [];
      const symbolsB = categorizedSymbols.get(b) || [];
      
      const probsA = symbolsA
        .map(s => s.probability ?? 0)
        .sort((x, y) => y - x); // descending
      const probsB = symbolsB
        .map(s => s.probability ?? 0)
        .sort((x, y) => y - x); // descending
      
      // Compare probabilities in order (highest first, then second highest, etc.)
      const maxLen = Math.max(probsA.length, probsB.length);
      for (let i = 0; i < maxLen; i++) {
        const probA = probsA[i] ?? 0;
        const probB = probsB[i] ?? 0;
        if (probA !== probB) {
          return probB - probA; // descending (higher probability first)
        }
      }
      
      // If all probabilities are equal, sort alphabetically
      return a.localeCompare(b);
    });
  }, [categorizedSymbols]);

  const currentSymbols = useMemo(() => {
    if (!selectedCategory) return [];
    const symbols = categorizedSymbols.get(selectedCategory) || [];
    // Sort by probability (highest first)
    return [...symbols].sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0));
  }, [selectedCategory, categorizedSymbols]);

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedCategoryIcon(null);
  };

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {selectedCategory && (
            <Button
              onClick={handleBackToCategories}
              variant="outline"
              size="icon"
              title="Retour aux catégories"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {selectedCategoryIcon && (
            <div className="w-12 h-12 flex items-center justify-center">
              <Image
                src={selectedCategoryIcon}
                alt={selectedCategory || ""}
                width={48}
                height={48}
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <h1 className="text-3xl font-black tracking-tight">
            {selectedCategory ? (
              <span className="capitalize">{selectedCategory}</span>
            ) : (
              "Tableau CAA"
            )}
          </h1>
        </div>
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
      ) : selectedCategory ? (
        // Show symbols for selected category
        <div className="grid grid-cols-6 gap-4">
          {currentSymbols.map((symbol) => (
            <SymbolCard
              key={symbol.key}
              symbol={symbol}
              onClick={() => onSymbolClick(symbol)}
              showLabel={showLabels}
            />
          ))}
        </div>
      ) : (
        // Show categories
        <div className="grid grid-cols-6 gap-4">
          {sortedCategories.map((category) => {
            const symbols = categorizedSymbols.get(category) || [];
            const maxProbability = Math.max(...symbols.map(s => s.probability ?? 0));
            const iconId = (tagIconMapping as Record<string, number>)[category.toLowerCase()];
            const iconUrl = iconId ? getPictogramImageUrl(iconId) : null;
            return (
              <CategoryCard
                key={category}
                category={category}
                count={symbols.length}
                maxProbability={maxProbability}
                iconUrl={iconUrl}
                showLabel={showLabels}
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedCategoryIcon(iconUrl);
                }}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
