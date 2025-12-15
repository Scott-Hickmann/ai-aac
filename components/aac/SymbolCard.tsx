import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Symbol } from "@/types/symbol";

interface SymbolCardProps {
  symbol: Symbol;
  onClick: () => void;
  showLabel?: boolean;
}

export function SymbolCard({ symbol, onClick, showLabel = true }: SymbolCardProps) {
  const isHighProbability = (symbol.probability ?? 0) > 0.001;
  
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer aspect-square p-0",
        "shadow-md active:scale-95 transition-transform",
        isHighProbability && "bg-green-50 border-green-500 border-2"
      )}
    >
      <CardContent className="h-full p-4 flex flex-col items-center justify-center gap-3">
        <div className={cn(
          "relative w-full flex items-center justify-center",
          showLabel ? "flex-1" : "h-full"
        )}>
          <Image
            src={symbol.imageUrl}
            alt={symbol.label}
            width={120}
            height={120}
            className="max-w-full max-h-full object-contain"
            unoptimized
          />
        </div>
        {showLabel && (
          <p className="text-base sm:text-lg font-bold text-center leading-tight">
            {symbol.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
