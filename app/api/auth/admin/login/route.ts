import { NextRequest, NextResponse } from "next/server";

const rawGateway = process.env.API_GATEWAY || "http://localhost:7001";
const API_GATEWAY = rawGateway.startsWith("http://") || rawGateway.startsWith("https://")
  ? rawGateway
  : `http://${rawGateway}`;

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password required" }, { status: 400 });
    }

    const loginRes = await fetch(`${API_GATEWAY}/api/v1/users/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const responseText = await loginRes.text();
    if (!loginRes.ok) {
      let message = "Invalid credentials";
      try {
        const parsed = JSON.parse(responseText) as { message?: string; detail?: string };
        message = parsed.message || parsed.detail || message;
      } catch {
        // Keep fallback message when backend body is not JSON.
      }
      return NextResponse.json({ message }, { status: loginRes.status });
    }

    const user = responseText ? JSON.parse(responseText) : null;
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Admin login proxy error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
