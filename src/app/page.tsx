"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Wand2, CheckCircle, Upload, Settings } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Course Re-writer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your Canvas LMS course content to match the styling of a model course
            using AI-powered rewriting with DesignTools/DesignPLUS compliance.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Load Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect to Canvas LMS and load pages, assignments, and discussions
                from your target course.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Analyze Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Extract styling patterns and structure from a model course
                to guide the rewriting process.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Rewrite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Use Azure OpenAI to intelligently rewrite content while preserving
                instructional text and maintaining DesignTools compliance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Review & Approve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Preview changes side-by-side, approve individual items,
                and publish back to Canvas when ready.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/connect">
            <Button size="lg" className="gap-2">
              <Upload className="h-5 w-5" />
              Get Started
            </Button>
          </Link>
        </div>

        {/* Workflow Steps Preview */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-center mb-8">5-Step Workflow</h2>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            {[
              { step: 1, label: "Connect" },
              { step: 2, label: "Model" },
              { step: 3, label: "Rewrite" },
              { step: 4, label: "Review" },
              { step: 5, label: "Publish" },
            ].map(({ step, label }, index) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {step}
                  </div>
                  <span className="text-sm mt-2 text-muted-foreground">{label}</span>
                </div>
                {index < 4 && (
                  <div className="w-8 h-0.5 bg-border mx-2 mt-[-1rem]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
