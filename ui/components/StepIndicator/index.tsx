import { cn } from "@/ui/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  compact?: boolean;
}

const StepIndicator = ({
  steps,
  currentStep,
  className,
  compact = false,
}: StepIndicatorProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.label}
              className={cn(
                "flex items-center",
                !isLast && "flex-1",
              )}
            >
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 font-medium transition-all",
                    compact ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isActive &&
                      "border-primary bg-primary/10 text-primary",
                    !isCompleted &&
                      !isActive &&
                      "border-muted-foreground/30 text-muted-foreground/50",
                  )}
                >
                  {isCompleted ? (
                    <Check className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                  ) : (
                    index + 1
                  )}
                </div>
                {/* Label below circle */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "font-medium leading-tight",
                      compact ? "text-[10px]" : "text-xs",
                      isCompleted && "text-primary",
                      isActive && "text-primary",
                      !isCompleted && !isActive && "text-muted-foreground/60",
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && !compact && (
                    <p
                      className={cn(
                        "text-[10px] mt-0.5",
                        isActive
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50",
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 rounded-full transition-all",
                    compact ? "mt-[-1.25rem]" : "mt-[-1.75rem]",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
export type { StepIndicatorProps, Step };
