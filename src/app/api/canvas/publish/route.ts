import { NextRequest, NextResponse } from "next/server";
import type { ItemKind } from "@/types";

interface PublishItem {
  kind: ItemKind;
  canvasId: string | number;
  html: string;
}

interface PublishResult {
  canvasId: string | number;
  kind: ItemKind;
  success: boolean;
  error?: string;
}

async function updatePage(
  baseUrl: string,
  token: string,
  courseId: string,
  pageUrl: string,
  html: string
): Promise<PublishResult> {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/courses/${courseId}/pages/${pageUrl}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wiki_page: {
            body: html,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        canvasId: pageUrl,
        kind: "page",
        success: false,
        error: `${response.status}: ${errorText}`,
      };
    }

    return { canvasId: pageUrl, kind: "page", success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { canvasId: pageUrl, kind: "page", success: false, error: message };
  }
}

async function updateAssignment(
  baseUrl: string,
  token: string,
  courseId: string,
  assignmentId: number,
  html: string
): Promise<PublishResult> {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/courses/${courseId}/assignments/${assignmentId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment: {
            description: html,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        canvasId: assignmentId,
        kind: "assignment",
        success: false,
        error: `${response.status}: ${errorText}`,
      };
    }

    return { canvasId: assignmentId, kind: "assignment", success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      canvasId: assignmentId,
      kind: "assignment",
      success: false,
      error: message,
    };
  }
}

async function updateDiscussion(
  baseUrl: string,
  token: string,
  courseId: string,
  discussionId: number,
  html: string
): Promise<PublishResult> {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/courses/${courseId}/discussion_topics/${discussionId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: html,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        canvasId: discussionId,
        kind: "discussion",
        success: false,
        error: `${response.status}: ${errorText}`,
      };
    }

    return { canvasId: discussionId, kind: "discussion", success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      canvasId: discussionId,
      kind: "discussion",
      success: false,
      error: message,
    };
  }
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
    const { courseId, items, dryRun } = body as {
      courseId: string;
      items: PublishItem[];
      dryRun: boolean;
    };

    if (!courseId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing courseId or items" },
        { status: 400 }
      );
    }

    // If dry run, just return success without actually updating
    if (dryRun) {
      const results: PublishResult[] = items.map((item) => ({
        canvasId: item.canvasId,
        kind: item.kind,
        success: true,
      }));

      return NextResponse.json({
        success: true,
        dryRun: true,
        results,
      });
    }

    // Actually publish items
    const results: PublishResult[] = [];

    for (const item of items) {
      let result: PublishResult;

      switch (item.kind) {
        case "page":
          result = await updatePage(
            canvasBaseUrl,
            canvasToken,
            courseId,
            item.canvasId as string,
            item.html
          );
          break;
        case "assignment":
          result = await updateAssignment(
            canvasBaseUrl,
            canvasToken,
            courseId,
            item.canvasId as number,
            item.html
          );
          break;
        case "discussion":
          result = await updateDiscussion(
            canvasBaseUrl,
            canvasToken,
            courseId,
            item.canvasId as number,
            item.html
          );
          break;
        default:
          result = {
            canvasId: item.canvasId,
            kind: item.kind,
            success: false,
            error: `Unknown item kind: ${item.kind}`,
          };
      }

      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    const success = successCount === results.length;

    return NextResponse.json({
      success,
      dryRun: false,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
      },
    });
  } catch (error: unknown) {
    console.error("Error publishing items:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
