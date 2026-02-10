"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRewriterStore } from "@/lib/store/rewriter-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, FileText, ClipboardList, MessageSquare } from "lucide-react";
import type { CourseItem } from "@/types";

export default function ConnectPage() {
  const router = useRouter();
  const {
    canvasBaseUrl,
    canvasToken,
    targetCourseId,
    modelCourseId,
    globalInstructions,
    includePages,
    includeAssignments,
    includeDiscussions,
    items,
    isLoading,
    error,
    setCanvasConfig,
    setTargetCourse,
    setModelCourse,
    setGlobalInstructions,
    setIncludePages,
    setIncludeAssignments,
    setIncludeDiscussions,
    setItems,
    setLoading,
    setError,
    setCurrentStep,
  } = useRewriterStore();

  const [localBaseUrl, setLocalBaseUrl] = useState(canvasBaseUrl);
  const [localToken, setLocalToken] = useState(canvasToken);
  const [localTargetId, setLocalTargetId] = useState(targetCourseId);
  const [localModelId, setLocalModelId] = useState(modelCourseId);
  const [localInstructions, setLocalInstructions] = useState(globalInstructions);

  // Sync local state with store on mount
  useEffect(() => {
    setLocalBaseUrl(canvasBaseUrl);
    setLocalToken(canvasToken);
    setLocalTargetId(targetCourseId);
    setLocalModelId(modelCourseId);
    setLocalInstructions(globalInstructions);
  }, [canvasBaseUrl, canvasToken, targetCourseId, modelCourseId, globalInstructions]);

  // Set current step
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  const handleLoadItems = async () => {
    if (!localBaseUrl || !localToken || !localTargetId) {
      setError("Please fill in Canvas URL, API Token, and Target Course ID");
      return;
    }

    // Save config to store
    setCanvasConfig(localBaseUrl, localToken);
    setGlobalInstructions(localInstructions);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/canvas/load-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Canvas-Base-URL": localBaseUrl,
          "X-Canvas-Token": localToken,
        },
        body: JSON.stringify({
          courseId: localTargetId,
          includePages,
          includeAssignments,
          includeDiscussions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load items");
      }

      setItems(data.items);
      setTargetCourse(localTargetId, data.courseName);

      // Also set model course ID
      if (localModelId) {
        setModelCourse(localModelId, ""); // Name will be fetched in model step
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (items.length === 0) {
      setError("Please load items from the target course first");
      return;
    }
    if (!localModelId) {
      setError("Please enter a Model Course ID");
      return;
    }
    setModelCourse(localModelId, "");
    setCurrentStep(2);
    router.push("/model");
  };

  const itemCounts = {
    page: items.filter((i) => i.kind === "page").length,
    assignment: items.filter((i) => i.kind === "assignment").length,
    discussion: items.filter((i) => i.kind === "discussion").length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Step 1: Connect + Load</h1>
        <p className="text-muted-foreground mt-2">
          Connect to Canvas LMS and load content from your target course.
        </p>
      </div>

      {/* Canvas Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Canvas Connection</CardTitle>
          <CardDescription>
            Enter your Canvas LMS credentials. Your API token can be generated from
            Canvas Settings &gt; Approved Integrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Canvas Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://your-institution.instructure.com"
                value={localBaseUrl}
                onChange={(e) => setLocalBaseUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">API Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Your Canvas API token"
                value={localToken}
                onChange={(e) => setLocalToken(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course IDs */}
      <Card>
        <CardHeader>
          <CardTitle>Course Selection</CardTitle>
          <CardDescription>
            Enter the course IDs for your target course (to rewrite) and model course
            (style reference).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetId">Target Course ID</Label>
              <Input
                id="targetId"
                placeholder="e.g., 12345"
                value={localTargetId}
                onChange={(e) => setLocalTargetId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The course whose content will be rewritten
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelId">Model Course ID</Label>
              <Input
                id="modelId"
                placeholder="e.g., 67890"
                value={localModelId}
                onChange={(e) => setLocalModelId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The course whose styling will be used as reference
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Types */}
      <Card>
        <CardHeader>
          <CardTitle>Content Types</CardTitle>
          <CardDescription>
            Select which content types to load from the target course.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pages"
                checked={includePages}
                onCheckedChange={(checked) => setIncludePages(checked as boolean)}
              />
              <Label htmlFor="pages" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pages
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="assignments"
                checked={includeAssignments}
                onCheckedChange={(checked) => setIncludeAssignments(checked as boolean)}
              />
              <Label htmlFor="assignments" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Assignments
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="discussions"
                checked={includeDiscussions}
                onCheckedChange={(checked) => setIncludeDiscussions(checked as boolean)}
              />
              <Label htmlFor="discussions" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Discussions
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Global Instructions (Optional)</CardTitle>
          <CardDescription>
            Provide any global instructions that should apply to all rewrites.
            These will be included in every LLM prompt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Ensure all headers use the blue color scheme. Keep the tone professional but approachable."
            value={localInstructions}
            onChange={(e) => setLocalInstructions(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Load Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleLoadItems}
          disabled={isLoading || !localBaseUrl || !localToken || !localTargetId}
          className="gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Loading..." : "Load Target Course Items"}
        </Button>
      </div>

      {/* Loaded Items Summary */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Loaded Items</CardTitle>
            <CardDescription>
              {items.length} items loaded from the target course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                {itemCounts.page} Pages
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <ClipboardList className="h-3 w-3" />
                {itemCounts.assignment} Assignments
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {itemCounts.discussion} Discussions
              </Badge>
            </div>

            {/* Item list preview */}
            <div className="max-h-64 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 20).map((item: CourseItem) => (
                    <tr key={`${item.kind}:${item.canvasId}`} className="border-t">
                      <td className="p-2">
                        <Badge variant="outline" className="capitalize">
                          {item.kind}
                        </Badge>
                      </td>
                      <td className="p-2">{item.title}</td>
                    </tr>
                  ))}
                  {items.length > 20 && (
                    <tr className="border-t">
                      <td colSpan={2} className="p-2 text-muted-foreground text-center">
                        ... and {items.length - 20} more items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Button */}
      {items.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleNext} size="lg">
            Next: Model Course
          </Button>
        </div>
      )}
    </div>
  );
}
