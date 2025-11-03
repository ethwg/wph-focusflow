import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers"; // your existing helper

export const dynamic = "force-dynamic";

interface N8nWebhookPayload {
  userId: string;
  requestedAt: string;
}

interface N8nWebhookResponse {
  success?: boolean;
  timestamp?: string;
  error?: string;
}

export async function POST() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The user id your DB uses (you looked up via clerk_id elsewhere).
    // If you need the DB user_id instead of auth.userId, you can query it here.
    const userId = auth.userId;

    const base = process.env.N8N_WEBHOOK_URL; // e.g. https://your-n8n-host
    const apiKey = process.env.N8N_ADMIN_KEY; // optional
    if (!base) {
      return NextResponse.json(
        { error: "Missing N8N_WEBHOOK_URL" },
        { status: 500 },
      );
    }

    // Your n8n webhook path — adjust as needed
    const url = `${base.replace(/\/$/, "")}/webhook/publish-focus-report`;

    const payload: N8nWebhookPayload = {
      userId,
      requestedAt: new Date().toISOString(),
    };

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify(payload),
      // Note: we expect a simple JSON { success: boolean, timestamp: string }
    });

    const text = await upstream.text().catch(() => "");
    // Try parse JSON, fallback to {success:..., timestamp:...} if your flow returns plain text
    let json: N8nWebhookResponse | null = null;
    try {
      json = JSON.parse(text) as N8nWebhookResponse;
    } catch {
      json = null;
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: json?.error || text || upstream.statusText },
        { status: 502 },
      );
    }

    // Normalize response
    const success = Boolean(json?.success ?? true);
    const timestamp = json?.timestamp ?? new Date().toISOString();

    return NextResponse.json({ success, timestamp }, { status: 200 });
  } catch (e) {
    console.error("publish-focus-report error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
