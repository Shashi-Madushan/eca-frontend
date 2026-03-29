import { NextRequest, NextResponse } from "next/server";

const rawGateway = process.env.API_GATEWAY || "http://localhost:7001";
const normalizedGateway = rawGateway.startsWith("http://") || rawGateway.startsWith("https://")
  ? rawGateway
  : `http://${rawGateway}`;
const API_GATEWAY = normalizedGateway.replace(/\/$/, "");

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  return handleProxy(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  return handleProxy(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  return handleProxy(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  return handleProxy(req, await params);
}

async function handleProxy(req: NextRequest, params: { slug?: string[] }) {
  try {
    const slugPath = params.slug ? params.slug.join("/") : "";
    const searchParams = req.nextUrl.searchParams.toString();
    const query = searchParams ? `?${searchParams}` : "";

    const targetUrl = `${API_GATEWAY}/api/v1/orders${slugPath ? `/${slugPath}` : ""}${query}`;

    const headers = new Headers(req.headers);
    headers.delete("host");

    let body;
    const contentType = req.headers.get("content-type") || "";
    
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (contentType.includes("multipart/form-data")) {
        // Forward FormData natively; fetch sets the correct Content-Type with boundary
        body = await req.formData();
        headers.delete("content-type");
        headers.delete("content-length");
      } else if (contentType.includes("application/json") || contentType.includes("text/")) {
        body = await req.text();
      } else {
        // Fallback
        const clonedReq = req.clone();
        body = (await clonedReq.blob()) || undefined;
      }
    }

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete("content-encoding");

    const responseBody = await res.text();

    return new NextResponse(responseBody, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Orders Proxy error:", error);
    return NextResponse.json({ message: "Gateway error" }, { status: 500 });
  }
}
