import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Symbol } from "@/types/symbol";

interface SelectedSymbolProps {
  symbol: Symbol;
  onRemove: () => void;
  showLabel?: boolean;
}

export function SelectedSymbol({ symbol, onRemove, showLabel = true }: SelectedSymbolProps) {
  return (
    <Button
      variant="outline"
      onClick={onRemove}
      className={cn(
        "relative h-auto shrink-0 p-2 flex-col gap-1",
        "bg-card active:scale-95"
      )}
    >
      <Image
        src={symbol.imageUrl}
        alt={symbol.label}
        width={48}
        height={48}
        className="w-12 h-12 object-contain"
        unoptimized
      />
      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
        <X className="w-3 h-3" />
      </span>
      {showLabel && (
        <p className="text-xs font-semibold text-center max-w-[60px] truncate">
          {symbol.label}
        </p>
      )}
    </Button>
  );
}
