import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY = process.env.API_GATEWAY || "http://34.49.106.28:80";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug || slug.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Reconstruct the image path: PROD02/e13700a6-31fc-47b2-83cc-f6a7c51bd5d3.png
    const imagePath = slug.join("/");
    
    // Build the backend URL
    const backendUrl = `${API_GATEWAY}/api/v1/products/images/${imagePath}`;

    // Fetch the image from the backend
    const response = await fetch(backendUrl, {
      headers: {
        "User-Agent": request.headers.get("user-agent") || "ECA-Frontend",
      },
      // Revalidate every hour (3600 seconds)
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Get the content type from the backend response
    const contentType = response.headers.get("content-type") || "image/png";

    // Read the image buffer
    const buffer = await response.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours on client
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
