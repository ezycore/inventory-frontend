// coding-standard: maintained
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { HEADER_LINE_META, type ReceiptHeaderLine } from "@/types/receipt";
import type { ReceiptSettingsActions } from "@/hooks";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Switch } from "@/ui/components/switch";

interface LetterheadLineRowProps {
  line: ReceiptHeaderLine;
  isFirst: boolean;
  isLast: boolean;
  actions: ReceiptSettingsActions;
}

/**
 * One reorderable letterhead identity line: order buttons, a visibility switch,
 * the source label (or an editable caption + free-text field for custom lines),
 * and a delete button for custom lines.
 */
export default function LetterheadLineRow({
  line,
  isFirst,
  isLast,
  actions,
}: LetterheadLineRowProps) {
  const meta = HEADER_LINE_META[line.source];

  return (
    <div className="flex items-start gap-3 rounded-md border bg-card p-3">
      <div className="flex flex-col pt-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={isFirst}
          onClick={() => actions.moveLine(line.id, -1)}
          aria-label="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={isLast}
          onClick={() => actions.moveLine(line.id, 1)}
          aria-label="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="text-sm font-medium">{meta.label}</span>
          <span className="text-xs text-muted-foreground">{meta.hint}</span>
        </div>

        {meta.custom ? (
          <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
            <Input
              value={line.label ?? ""}
              onChange={(e) => actions.setLineLabel(line.id, e.target.value)}
              placeholder="Label (optional)"
            />
            <Input
              value={line.text ?? ""}
              onChange={(e) => actions.setLineText(line.id, e.target.value)}
              placeholder="e.g. Trade Licence: 12345"
            />
          </div>
        ) : meta.editableLabel ? (
          <Input
            value={line.label ?? ""}
            onChange={(e) => actions.setLineLabel(line.id, e.target.value)}
            placeholder="Label shown before the value"
          />
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 pt-0.5">
        <Switch
          checked={line.visible}
          onCheckedChange={() => actions.toggleLine(line.id)}
          aria-label={line.visible ? "Hide line" : "Show line"}
        />
        {meta.custom ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => actions.removeLine(line.id)}
            aria-label="Remove line"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
