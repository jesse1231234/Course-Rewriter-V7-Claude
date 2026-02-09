"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = [
  { number: 1, label: "Connect", path: "/connect" },
  { number: 2, label: "Model", path: "/model" },
  { number: 3, label: "Rewrite", path: "/rewrite" },
  { number: 4, label: "Review", path: "/review" },
  { number: 5, label: "Publish", path: "/publish" },
];

interface WorkflowStepperProps {
  currentStep?: number;
}

export function WorkflowStepper({ currentStep }: WorkflowStepperProps) {
  const pathname = usePathname();

  // Determine current step from path if not provided
  const activeStep =
    currentStep ??
    steps.find((s) => pathname.startsWith(s.path))?.number ??
    1;

  return (
    <nav className="w-full py-4 border-b bg-background">
      <div className="container mx-auto px-4">
        <ol className="flex items-center justify-center gap-2 md:gap-4">
          {steps.map((step, index) => {
            const isActive = step.number === activeStep;
            const isCompleted = step.number < activeStep;
            const isClickable = step.number <= activeStep;

            return (
              <li key={step.number} className="flex items-center">
                {/* Step indicator */}
                <Link
                  href={isClickable ? step.path : "#"}
                  className={cn(
                    "flex items-center",
                    !isClickable && "pointer-events-none"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full text-sm font-semibold transition-colors",
                      isActive &&
                        "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                      isCompleted && "bg-primary text-primary-foreground",
                      !isActive &&
                        !isCompleted &&
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={cn(
                      "hidden md:block ml-2 text-sm font-medium",
                      isActive && "text-foreground",
                      isCompleted && "text-foreground",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </Link>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 md:w-12 h-0.5 mx-2",
                      step.number < activeStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
