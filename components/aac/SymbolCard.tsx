import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Symbol } from "@/types/symbol";

interface SymbolCardProps {
  symbol: Symbol;
  onClick: () => void;
}

export function SymbolCard({ symbol, onClick }: SymbolCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer aspect-square p-0",
        "shadow-md active:scale-95 transition-transform"
      )}
    >
      <CardContent className="h-full p-4 flex flex-col items-center justify-center gap-3">
        <div className="relative w-full flex-1 flex items-center justify-center">
          <Image
            src={symbol.imageUrl}
            alt={symbol.label}
            width={120}
            height={120}
            className="max-w-full max-h-full object-contain"
            unoptimized
          />
        </div>
        <p className="text-base sm:text-lg font-bold text-center leading-tight">
          {symbol.label}
        </p>
      </CardContent>
    </Card>
  );
}
