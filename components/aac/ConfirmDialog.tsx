"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Volume2 } from "lucide-react";

interface ConfirmDialogProps {
  sentence: string;
  onConfirm: () => void;
  onReject: () => void;
  onReplay: () => void;
  isReplaying: boolean;
}

export function ConfirmDialog({
  sentence,
  onConfirm,
  onReject,
  onReplay,
  isReplaying,
}: ConfirmDialogProps) {
  return (
    <Card className="m-4 p-6 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">C&apos;était correct ?</h2>
        <p className="text-xl text-muted-foreground">&quot;{sentence}&quot;</p>
      </div>

      <div className="flex flex-col gap-4">
        <Button
          size="lg"
          variant="outline"
          className="h-16 text-lg gap-2"
          onClick={onReplay}
          disabled={isReplaying}
        >
          <Volume2 className={`h-6 w-6 ${isReplaying ? "animate-pulse" : ""}`} />
          {isReplaying ? "Lecture..." : "Réécouter"}
        </Button>

        <div className="flex gap-4">
          <Button
            size="lg"
            variant="outline"
            className="flex-1 h-20 text-xl gap-2 border-red-300 hover:bg-red-50 hover:border-red-400"
            onClick={onReject}
          >
            <X className="h-8 w-8 text-red-500" />
            Non
          </Button>
          <Button
            size="lg"
            className="flex-1 h-20 text-xl gap-2 bg-green-600 hover:bg-green-700"
            onClick={onConfirm}
          >
            <Check className="h-8 w-8" />
            Oui
          </Button>
        </div>
      </div>
    </Card>
  );
}
