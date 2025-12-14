import { NextRequest, NextResponse } from "next/server";
import { suggestQueries, suggestSymbols } from "@/lib/symbolQueries";

export async function POST(request: NextRequest) {
  try {
    const { selectedWords, conversationHistory = [] } = await request.json();

    if (
      (!selectedWords || selectedWords.length === 0) &&
      conversationHistory.length === 0
    ) {
      return NextResponse.json({ symbols: [] });
    }

    const queries = await suggestQueries({ selectedWords, conversationHistory });
    const symbols = suggestSymbols(queries);

    return NextResponse.json({ symbols });
  } catch (error) {
    console.error("Error fetching symbols:", error);
    return NextResponse.json(
      { error: "Failed to fetch symbols" },
      { status: 500 }
    );
  }
}
