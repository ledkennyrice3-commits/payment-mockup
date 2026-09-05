import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const symbols = encodeURIComponent(
      JSON.stringify(["USDCUSDT", "BTCUSDT", "ETHUSDT"]),
    );
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Binance ticker data" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
