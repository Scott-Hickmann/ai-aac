import { Volume2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Symbol } from "@/types/symbol";
import { SelectedSymbol } from "./SelectedSymbol";

interface MessageBarProps {
  selectedSymbols: Symbol[];
  onRemoveSymbol: (index: number) => void;
  onSpeak: () => void;
  onClear: () => void;
  isSpeaking?: boolean;
  showLabels?: boolean;
}

export function MessageBar({
  selectedSymbols,
  onRemoveSymbol,
  onSpeak,
  onClear,
  isSpeaking = false,
  showLabels = true,
}: MessageBarProps) {
  const hasSymbols = selectedSymbols.length > 0;

  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b shadow-lg">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center gap-3">
          {/* Selected symbols row */}
          <ScrollArea className="flex-1">
            <div
              className={cn(
                "min-h-[88px] rounded-xl p-3 flex items-center gap-2",
                "bg-muted border shadow-inner"
              )}
            >
              {!hasSymbols ? (
                <p className="text-muted-foreground text-lg font-medium px-4 select-none">
                  Appuyez sur les symboles ci-dessous pour construire votre message...
                </p>
              ) : (
                selectedSymbols.map((symbol, index) => (
                  <SelectedSymbol
                    key={symbol.key}
                    symbol={symbol}
                    onRemove={() => onRemoveSymbol(index)}
                    showLabel={showLabels}
                  />
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={onSpeak}
              disabled={!hasSymbols || isSpeaking}
              size="lg"
              className="bg-emerald-600 text-white shadow-lg active:scale-95"
            >
              {isSpeaking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {isSpeaking ? "..." : "Parler"}
              </span>
            </Button>
            <Button
              onClick={onClear}
              disabled={!hasSymbols || isSpeaking}
              variant="destructive"
              size="lg"
              className="shadow-lg active:scale-95"
            >
              <Trash2 className="w-5 h-5" />
              <span className="hidden sm:inline">Effacer</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
