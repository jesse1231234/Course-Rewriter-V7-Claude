"use client";

import { WorkflowStepper } from "@/components/layout/WorkflowStepper";
import { useRewriterStore } from "@/lib/store/rewriter-store";
import Link from "next/link";

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentStep, targetCourseName, modelCourseName } = useRewriterStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Course Re-writer
          </Link>
          {targetCourseName && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Target:</span> {targetCourseName}
              {modelCourseName && (
                <>
                  {" | "}
                  <span className="font-medium">Model:</span> {modelCourseName}
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Stepper */}
      <WorkflowStepper currentStep={currentStep} />

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
