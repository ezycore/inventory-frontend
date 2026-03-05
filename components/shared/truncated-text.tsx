"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import { cn } from "@ui/lib/utils";

interface TruncatedTextProps {
  /**
   * The text content to display
   */
  text: string;
  /**
   * Number of lines to show before truncating (default: 2)
   */
  lines?: number;
  /**
   * Additional CSS classes for the text container
   */
  className?: string;
  /**
   * Additional CSS classes for the tooltip content
   */
  tooltipClassName?: string;
  /**
   * Whether to show tooltip (default: true)
   */
  showTooltip?: boolean;
}

/**
 * TruncatedText component that displays text with CSS line-clamp
 * and shows a tooltip with full text on hover when truncated.
 * 
 * This component automatically detects if the text is truncated and
 * only shows the tooltip when necessary.
 * 
 * @example
 * <TruncatedText 
 *   text="Very long description text..." 
 *   lines={2}
 *   className="text-sm text-muted-foreground"
 * />
 */
export function TruncatedText({
  text,
  lines = 2,
  className,
  tooltipClassName,
  showTooltip = true,
}: TruncatedTextProps) {
  const textRef = React.useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  // Check if text is truncated
  React.useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const checkTruncation = () => {
      // Compare scroll height with client height to detect overflow
      const truncated = element.scrollHeight > element.clientHeight;
      setIsTruncated(truncated);
    };

    checkTruncation();

    // Re-check on window resize for responsive layouts
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [text]);

  const textContent = (
    <p
      ref={textRef}
      className={cn("break-words", className)}
      style={{
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {text}
    </p>
  );

  // Only show tooltip if text is truncated and tooltip is enabled
  if (showTooltip && isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{textContent}</div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className={cn("max-w-sm whitespace-pre-wrap", tooltipClassName)}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    );
  }

  return textContent;
}
