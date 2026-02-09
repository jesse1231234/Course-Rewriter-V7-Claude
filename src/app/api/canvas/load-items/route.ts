import { NextRequest, NextResponse } from "next/server";
import type { CourseItem, CanvasPage, CanvasAssignment, CanvasDiscussion, CanvasCourse } from "@/types";

// Helper to follow Canvas pagination
async function fetchAllPages<T>(
  baseUrl: string,
  token: string,
  endpoint: string
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${baseUrl}/api/v1${endpoint}`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    results.push(...data);

    // Parse Link header for pagination
    const linkHeader = response.headers.get("Link");
    url = null;

    if (linkHeader) {
      const links = linkHeader.split(",");
      for (const link of links) {
        const match = link.match(/<([^>]+)>;\s*rel="next"/);
        if (match) {
          url = match[1];
          break;
        }
      }
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    // Use headers if provided, otherwise fall back to env variables
    const canvasBaseUrl = request.headers.get("X-Canvas-Base-URL") || process.env.CANVAS_BASE_URL;
    const canvasToken = request.headers.get("X-Canvas-Token") || process.env.CANVAS_API_TOKEN;

    if (!canvasBaseUrl || !canvasToken) {
      return NextResponse.json(
        { error: "Missing Canvas credentials. Provide via headers or set CANVAS_BASE_URL and CANVAS_API_TOKEN environment variables." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { courseId, includePages, includeAssignments, includeDiscussions } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Missing courseId" },
        { status: 400 }
      );
    }

    const items: CourseItem[] = [];

    // Fetch course info
    const courseResponse = await fetch(
      `${canvasBaseUrl}/api/v1/courses/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${canvasToken}`,
        },
      }
    );

    if (!courseResponse.ok) {
      const errorText = await courseResponse.text();
      throw new Error(`Failed to fetch course: ${courseResponse.status} - ${errorText}`);
    }

    const course: CanvasCourse = await courseResponse.json();

    // Fetch pages
    if (includePages) {
      const pages = await fetchAllPages<CanvasPage>(
        canvasBaseUrl,
        canvasToken,
        `/courses/${courseId}/pages?per_page=100`
      );

      // Fetch full content for each page
      for (const page of pages) {
        try {
          const pageResponse = await fetch(
            `${canvasBaseUrl}/api/v1/courses/${courseId}/pages/${page.url}`,
            {
              headers: {
                Authorization: `Bearer ${canvasToken}`,
              },
            }
          );

          if (pageResponse.ok) {
            const fullPage: CanvasPage = await pageResponse.json();
            items.push({
              kind: "page",
              title: fullPage.title,
              canvasId: fullPage.url,
              html: fullPage.body || "",
              url: `${canvasBaseUrl}/courses/${courseId}/pages/${fullPage.url}`,
              rewrittenHtml: null,
              approved: false,
              status: "original",
              error: null,
            });
          }
        } catch (e) {
          console.error(`Failed to fetch page ${page.url}:`, e);
        }
      }
    }

    // Fetch assignments
    if (includeAssignments) {
      const assignments = await fetchAllPages<CanvasAssignment>(
        canvasBaseUrl,
        canvasToken,
        `/courses/${courseId}/assignments?per_page=100`
      );

      for (const assignment of assignments) {
        items.push({
          kind: "assignment",
          title: assignment.name,
          canvasId: assignment.id,
          html: assignment.description || "",
          url: assignment.html_url,
          rewrittenHtml: null,
          approved: false,
          status: "original",
          error: null,
        });
      }
    }

    // Fetch discussions
    if (includeDiscussions) {
      const discussions = await fetchAllPages<CanvasDiscussion>(
        canvasBaseUrl,
        canvasToken,
        `/courses/${courseId}/discussion_topics?per_page=100`
      );

      for (const discussion of discussions) {
        items.push({
          kind: "discussion",
          title: discussion.title,
          canvasId: discussion.id,
          html: discussion.message || "",
          url: discussion.html_url,
          rewrittenHtml: null,
          approved: false,
          status: "original",
          error: null,
        });
      }
    }

    return NextResponse.json({
      items,
      courseName: course.name,
    });
  } catch (error: unknown) {
    console.error("Error loading items:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
