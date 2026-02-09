"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRewriterStore } from "@/lib/store/rewriter-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle, FileText, ClipboardList, MessageSquare } from "lucide-react";

export default function ModelPage() {
  const router = useRouter();
  const {
    canvasBaseUrl,
    canvasToken,
    modelCourseId,
    modelCourseName,
    modelSampleCounts,
    modelContext,
    modelStyleGuide,
    modelSignatureSnippets,
    isLoading,
    error,
    setModelCourse,
    setModelContext,
    setModelStyleGuide,
    setModelSignatureSnippets,
    setModelSampleCounts,
    setLoading,
    setError,
    setCurrentStep,
  } = useRewriterStore();

  const [localSampleCounts, setLocalSampleCounts] = useState(modelSampleCounts);
  const [modelItems, setModelItems] = useState<Array<{ kind: string; title: string; html: string }>>([]);
  const [step, setStep] = useState<"config" | "loading" | "analyzing" | "done">(
    modelStyleGuide ? "done" : "config"
  );

  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Load model course items
  const handleLoadModelCourse = async () => {
    if (!modelCourseId) {
      setError("Please enter a Model Course ID in the previous step");
      return;
    }

    setStep("loading");
    setLoading(true);
    setError(null);

    try {
      // Load items from model course
      const response = await fetch("/api/canvas/load-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Canvas-Base-URL": canvasBaseUrl,
          "X-Canvas-Token": canvasToken,
        },
        body: JSON.stringify({
          courseId: modelCourseId,
          includePages: localSampleCounts.pages > 0,
          includeAssignments: localSampleCounts.assignments > 0,
          includeDiscussions: localSampleCounts.discussions > 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load model course");
      }

      setModelCourse(modelCourseId, data.courseName);

      // Sample items according to counts
      const pages = data.items.filter((i: { kind: string }) => i.kind === "page").slice(0, localSampleCounts.pages);
      const assignments = data.items.filter((i: { kind: string }) => i.kind === "assignment").slice(0, localSampleCounts.assignments);
      const discussions = data.items.filter((i: { kind: string }) => i.kind === "discussion").slice(0, localSampleCounts.discussions);

      const sampledItems = [...pages, ...assignments, ...discussions];
      setModelItems(sampledItems);

      // Build model context (concatenated HTML)
      const contextParts = sampledItems.map((item: { kind: string; title: string; html: string }) =>
        `<!-- ${item.kind.toUpperCase()}: ${item.title} -->\n${item.html}`
      );
      const context = contextParts.join("\n\n---\n\n").slice(0, 14000); // Truncate to ~14KB
      setModelContext(context);

      // Build signature snippets (first 900 chars of each)
      const snippets = sampledItems.map((item: { kind: string; title: string; html: string }) =>
        `[${item.kind}] ${item.title}:\n${(item.html || "").slice(0, 900)}`
      ).join("\n\n---\n\n").slice(0, 3500);
      setModelSignatureSnippets(snippets);

      setModelSampleCounts(localSampleCounts);

      // Now generate style guide
      setStep("analyzing");
      await generateStyleGuide(context);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      setStep("config");
    } finally {
      setLoading(false);
    }
  };

  // Generate style guide using LLM
  const generateStyleGuide = async (context: string) => {
    try {
      const response = await fetch("/api/llm/style-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modelContext: context }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate style guide");
      }

      setModelStyleGuide(data.styleGuide);
      setStep("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      setStep("config");
    }
  };

  const handleNext = () => {
    if (!modelStyleGuide) {
      setError("Please analyze the model course first");
      return;
    }
    setCurrentStep(3);
    router.push("/rewrite");
  };

  const handleBack = () => {
    router.push("/connect");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Step 2: Model Course</h1>
        <p className="text-muted-foreground mt-2">
          Analyze the model course to extract styling patterns for the rewrite process.
        </p>
      </div>

      {/* Sample Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Configuration</CardTitle>
          <CardDescription>
            Specify how many items of each type to sample from the model course.
            More samples = better style extraction, but takes longer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pagesCount" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pages to Sample
              </Label>
              <Input
                id="pagesCount"
                type="number"
                min={0}
                max={10}
                value={localSampleCounts.pages}
                onChange={(e) =>
                  setLocalSampleCounts({
                    ...localSampleCounts,
                    pages: parseInt(e.target.value) || 0,
                  })
                }
                disabled={step !== "config"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignmentsCount" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Assignments to Sample
              </Label>
              <Input
                id="assignmentsCount"
                type="number"
                min={0}
                max={10}
                value={localSampleCounts.assignments}
                onChange={(e) =>
                  setLocalSampleCounts({
                    ...localSampleCounts,
                    assignments: parseInt(e.target.value) || 0,
                  })
                }
                disabled={step !== "config"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discussionsCount" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Discussions to Sample
              </Label>
              <Input
                id="discussionsCount"
                type="number"
                min={0}
                max={10}
                value={localSampleCounts.discussions}
                onChange={(e) =>
                  setLocalSampleCounts({
                    ...localSampleCounts,
                    discussions: parseInt(e.target.value) || 0,
                  })
                }
                disabled={step !== "config"}
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Model Course ID: <span className="font-mono">{modelCourseId || "Not set"}</span>
            {modelCourseName && (
              <span className="ml-2">({modelCourseName})</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress / Status */}
      {(step === "loading" || step === "analyzing") && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div>
                <p className="font-medium">
                  {step === "loading" && "Loading model course items..."}
                  {step === "analyzing" && "Analyzing model course with AI..."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {step === "loading" && "Fetching pages, assignments, and discussions"}
                  {step === "analyzing" && "Extracting DesignTools patterns and style guide"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Complete */}
      {step === "done" && modelStyleGuide && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Analysis Complete
              </CardTitle>
              <CardDescription>
                Successfully analyzed {modelItems.length || "multiple"} items from the model course.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {modelSampleCounts.pages} Pages
                </Badge>
                <Badge variant="secondary">
                  {modelSampleCounts.assignments} Assignments
                </Badge>
                <Badge variant="secondary">
                  {modelSampleCounts.discussions} Discussions
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Style Guide Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Style Guide</CardTitle>
              <CardDescription>
                This style guide will be used to inform all rewrites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {modelStyleGuide}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Signature Snippets Preview */}
          {modelSignatureSnippets && (
            <Card>
              <CardHeader>
                <CardTitle>Signature Snippets</CardTitle>
                <CardDescription>
                  Structural examples from the model course (truncated).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-md p-4 max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {modelSignatureSnippets.slice(0, 2000)}
                    {modelSignatureSnippets.length > 2000 && "..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>

        <div className="flex gap-4">
          {step === "config" && (
            <Button
              onClick={handleLoadModelCourse}
              disabled={isLoading || !modelCourseId}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Analyze Model Course
            </Button>
          )}

          {step === "done" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setModelStyleGuide("");
                  setStep("config");
                }}
              >
                Re-analyze
              </Button>
              <Button onClick={handleNext} size="lg">
                Next: Rewrite
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
