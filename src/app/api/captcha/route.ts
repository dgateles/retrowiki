import { NextRequest, NextResponse } from "next/server";
import { issueChallenge } from "@/lib/captcha";
import { checkRateLimit } from "@/lib/rate-limit";

const ALLOWED_ACTIONS = new Set(["register", "submit", "comment", "reset"]);

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") ?? "";
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const rl = await checkRateLimit(`captcha:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // Dificuldade adaptativa poderia escalar por reputação de IP aqui.
  const challenge = issueChallenge(action, 16);
  return NextResponse.json(challenge, {
    headers: { "Cache-Control": "no-store" },
  });
}
