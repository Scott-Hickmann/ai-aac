import { NextRequest, NextResponse } from "next/server";
import { suggestSymbolsWithPictoBERT } from "@/lib/pictobert";
import type { Symbol } from "@/types/symbol";

export async function POST(request: NextRequest) {
  try {
    const { selectedSymbols = [], conversationHistory = [] } =
      (await request.json()) as {
        selectedSymbols?: Symbol[];
        conversationHistory?: string[];
      };

    if (selectedSymbols.length === 0 && conversationHistory.length === 0) {
      return NextResponse.json({ symbols: [] });
    }

    console.log("[Suggest] Using PictoBERT");
    const symbols = await suggestSymbolsWithPictoBERT(selectedSymbols);
    return NextResponse.json({ symbols });
  } catch (error) {
    console.error("Error fetching symbols:", error);
    return NextResponse.json(
      { error: "Failed to fetch symbols" },
      { status: 500 }
    );
  }
}
