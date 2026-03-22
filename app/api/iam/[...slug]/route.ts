import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY = process.env.API_GATEWAY || "http://localhost:7001";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return handleProxy(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return handleProxy(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return handleProxy(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return handleProxy(req, await params);
}

async function handleProxy(req: NextRequest, params: { slug: string[] }) {
  try {
    const slugPath = params.slug.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const query = searchParams ? `?${searchParams}` : "";
    
    const targetUrl = `${API_GATEWAY}/api/v1/${slugPath}${query}`;

    const headers = new Headers(req.headers);
    headers.delete("host");

    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseHeaders = new Headers(res.headers);
    // Remove headers that might cause issues with Next.js Response
    responseHeaders.delete("content-encoding");

    let responseBody = await res.text();

    return new NextResponse(responseBody, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ message: "Gateway error" }, { status: 500 });
  }
}
