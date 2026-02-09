"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRewriterStore } from "@/lib/store/rewriter-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  ClipboardList,
  MessageSquare,
  PartyPopper,
} from "lucide-react";
import type { CourseItem, ItemKind } from "@/types";
import { itemKey } from "@/types";

interface PublishResult {
  canvasId: string | number;
  kind: ItemKind;
  success: boolean;
  error?: string;
}

export default function PublishPage() {
  const router = useRouter();
  const {
    canvasBaseUrl,
    canvasToken,
    targetCourseId,
    targetCourseName,
    items,
    isLoading,
    error,
    setLoading,
    setError,
    setCurrentStep,
    getApprovedItems,
  } = useRewriterStore();

  const [dryRun, setDryRun] = useState(true);
  const [publishProgress, setPublishProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const [publishComplete, setPublishComplete] = useState(false);

  useEffect(() => {
    setCurrentStep(5);
  }, [setCurrentStep]);

  const approvedItems = getApprovedItems();

  const itemCounts = {
    page: approvedItems.filter((i) => i.kind === "page").length,
    assignment: approvedItems.filter((i) => i.kind === "assignment").length,
    discussion: approvedItems.filter((i) => i.kind === "discussion").length,
  };

  const handlePublish = async () => {
    if (approvedItems.length === 0) {
      setError("No approved items to publish");
      return;
    }

    setLoading(true);
    setError(null);
    setPublishResults(null);
    setPublishComplete(false);

    setPublishProgress({
      current: 0,
      total: approvedItems.length,
    });

    try {
      const itemsToPublish = approvedItems.map((item) => ({
        kind: item.kind,
        canvasId: item.canvasId,
        html: item.rewrittenHtml!,
      }));

      const response = await fetch("/api/canvas/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Canvas-Base-URL": canvasBaseUrl,
          "X-Canvas-Token": canvasToken,
        },
        body: JSON.stringify({
          courseId: targetCourseId,
          items: itemsToPublish,
          dryRun,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Publish failed");
      }

      setPublishResults(data.results);
      setPublishComplete(true);

      if (data.summary) {
        if (data.summary.failed > 0) {
          setError(
            `Published ${data.summary.successful}/${data.summary.total} items. ${data.summary.failed} failed.`
          );
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
      setPublishProgress(null);
    }
  };

  const handleBack = () => {
    router.push("/review");
  };

  const handleStartOver = () => {
    router.push("/connect");
  };

  const getKindIcon = (kind: ItemKind) => {
    switch (kind) {
      case "page":
        return <FileText className="h-4 w-4" />;
      case "assignment":
        return <ClipboardList className="h-4 w-4" />;
      case "discussion":
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const successCount = publishResults?.filter((r) => r.success).length || 0;
  const failCount = publishResults?.filter((r) => !r.success).length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Step 5: Publish</h1>
        <p className="text-muted-foreground mt-2">
          Push approved changes back to Canvas LMS.
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Publish Summary</CardTitle>
          <CardDescription>
            Ready to publish {approvedItems.length} approved items to{" "}
            <strong>{targetCourseName || `Course ${targetCourseId}`}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
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
        </CardContent>
      </Card>

      {/* Approved Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Items to Publish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Title</th>
                  {publishResults && <th className="text-left p-2">Result</th>}
                </tr>
              </thead>
              <tbody>
                {approvedItems.map((item) => {
                  const result = publishResults?.find(
                    (r) => r.canvasId === item.canvasId && r.kind === item.kind
                  );

                  return (
                    <tr key={itemKey(item)} className="border-t">
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {getKindIcon(item.kind)}
                          <span className="capitalize">{item.kind}</span>
                        </div>
                      </td>
                      <td className="p-2">{item.title}</td>
                      {publishResults && (
                        <td className="p-2">
                          {result?.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-xs text-red-500">
                                {result?.error}
                              </span>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {approvedItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                      No approved items to publish
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dry Run Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dryRun" className="text-base">
                Dry Run Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                {dryRun
                  ? "Enabled: Simulates publish without making changes to Canvas"
                  : "Disabled: Changes will be pushed to Canvas"}
              </p>
            </div>
            <Switch id="dryRun" checked={dryRun} onCheckedChange={setDryRun} />
          </div>
        </CardContent>
      </Card>

      {/* Warning when not dry run */}
      {!dryRun && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Live Mode</AlertTitle>
          <AlertDescription>
            This will update content in Canvas. Make sure you have reviewed all
            changes before publishing.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Publish Progress */}
      {publishProgress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Publishing items...</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {publishProgress.current} / {publishProgress.total}
                </span>
              </div>
              <Progress
                value={(publishProgress.current / publishProgress.total) * 100}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publish Complete */}
      {publishComplete && publishResults && (
        <Alert variant={failCount === 0 ? "success" : "default"}>
          {failCount === 0 ? (
            <PartyPopper className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {dryRun ? "Dry Run Complete" : "Publish Complete"}
          </AlertTitle>
          <AlertDescription>
            {dryRun ? (
              <>
                Simulated publishing {successCount} items. No changes were made
                to Canvas. Disable dry run mode to publish for real.
              </>
            ) : (
              <>
                Successfully published {successCount} items to Canvas.
                {failCount > 0 && ` ${failCount} items failed.`}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>

        <div className="flex gap-4">
          {publishComplete && !dryRun && failCount === 0 && (
            <Button variant="outline" onClick={handleStartOver}>
              Start Over
            </Button>
          )}

          <Button
            onClick={handlePublish}
            disabled={isLoading || approvedItems.length === 0}
            size="lg"
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Upload className="h-4 w-4" />
            {dryRun ? "Run Dry Test" : "Publish to Canvas"}
          </Button>
        </div>
      </div>
    </div>
  );
}
