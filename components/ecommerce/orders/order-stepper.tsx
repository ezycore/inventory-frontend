// coding-standard: maintained
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";
import { DEFAULT_ORDER_STATUS_LABELS } from "@/lib/order-status";

/**
 * Horizontal lifecycle stepper. Renders whichever branch it is handed —
 * `DELIVERY_STEPS` (courier) or `PICKUP_STEPS` (in-store) — so a pickup order and
 * a delivery order each show their own path off `order.fulfillmentType`.
 *
 * Step wording is the organization's (merchants may rename the steps), with the
 * canonical name kept as the node's tooltip so a support conversation about a
 * renamed store still has a shared vocabulary.
 */
export function OrderStepper({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: readonly string[];
}) {
  const { labelFor } = useOrderStatusLabels();

  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const current = i === currentStep;
        const label = labelFor(step);
        // Only worth a tooltip when the merchant actually renamed this step.
        const canonical = DEFAULT_ORDER_STATUS_LABELS[step];
        const title = canonical && canonical !== label ? canonical : undefined;
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
              {/* 10px on a phone: five labels at text-xs plus their connectors
                  exceed a 360px viewport and wrap mid-word. */}
              <span
                title={title}
                className={cn(
                  "text-center text-[10px] sm:text-xs",
                  current
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-0.5 mb-5 h-0.5 flex-1 sm:mx-1",
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
