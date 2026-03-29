import { NextRequest, NextResponse } from "next/server";

const rawGateway = process.env.API_GATEWAY || "http://localhost:7001";
const API_GATEWAY = rawGateway.startsWith("http://") || rawGateway.startsWith("https://")
  ? rawGateway
  : `http://${rawGateway}`;

interface AdminRegisterPayload {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as AdminRegisterPayload;

    if (
      !payload.username ||
      !payload.password ||
      !payload.email ||
      !payload.firstName ||
      !payload.lastName
    ) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const createRes = await fetch(`${API_GATEWAY}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        userType: "ADMIN",
        status: "ACTIVE",
      }),
    });

    const responseText = await createRes.text();
    if (!createRes.ok) {
      let message = "Failed to register admin";
      try {
        const parsed = JSON.parse(responseText) as { message?: string; detail?: string };
        message = parsed.message || parsed.detail || message;
      } catch {
        // Keep fallback message when backend body is not JSON.
      }
      return NextResponse.json({ message }, { status: createRes.status });
    }

    const user = responseText ? JSON.parse(responseText) : null;
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Admin register proxy error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
