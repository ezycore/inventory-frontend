// coding-standard: maintained
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { STEP_LABELS } from "./order-detail-helpers";

/**
 * Horizontal lifecycle stepper. Renders whichever branch it is handed —
 * `DELIVERY_STEPS` (courier) or `PICKUP_STEPS` (in-store) — so a pickup order and
 * a delivery order each show their own path off `order.fulfillmentType`.
 */
export function OrderStepper({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: readonly string[];
}) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const current = i === currentStep;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary bg-primary text-primary-foreground",
                  !done && !current && "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs",
                  current
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 mb-5 h-0.5 flex-1",
                  i < currentStep ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
