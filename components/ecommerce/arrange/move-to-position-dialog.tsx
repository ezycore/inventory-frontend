"use client";
// coding-standard: maintained

import { useState } from "react";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { NumberField } from "@/ui/components/number-field";

/**
 * "Move to position…" — for a long list, where dragging a product from #180 to
 * #3 means scrolling past everything in between. Positions are 1-based, as the
 * row numbers show them.
 */
export function MoveToPositionDialog({
  name,
  current,
  count,
  onMove,
  onClose,
}: {
  name: string;
  /** 1-based. */
  current: number;
  count: number;
  onMove: (position: number) => void;
  onClose: () => void;
}) {
  const [position, setPosition] = useState<number | null>(current);
  const valid = position != null && position >= 1 && position <= count;

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Move to position</DialogTitle>
          <DialogDescription>
            Where should {name} go? It is at {current} of {count}.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (position == null || !valid) return;
            onMove(position);
            onClose();
          }}
        >
          <NumberField
            aria-label="Position"
            value={position}
            onChange={setPosition}
            min={1}
            max={count}
            precision={0}
            showSteppers
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Move
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
