import { NextResponse } from "next/server";

/**
 * Lightweight health endpoint for Docker / reverse-proxy probes.
 * GET /health
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "medismile-admin",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
