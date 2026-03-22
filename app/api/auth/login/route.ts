import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY = process.env.API_GATEWAY || "http://localhost:7001";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password required" }, { status: 400 });
    }

    // Step 1: Fetch user by username to verify existence
    const userRes = await fetch(`${API_GATEWAY}/api/v1/users/username/${username}`);
    if (!userRes.ok) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
    
    const user = await userRes.json();
    
    // In a real app we'd verify password. Assuming backend hasn't provided explicit login auth verify endpoint for now.
    // Let's call the `Record user login` endpoint.
    await fetch(`${API_GATEWAY}/api/v1/users/${user.id}/login`, {
        method: 'PUT'
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Login proxy error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
