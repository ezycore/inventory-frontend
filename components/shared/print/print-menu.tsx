"use client";
// coding-standard: maintained

import { Printer } from "lucide-react";
import { Button } from "@ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { toast } from "sonner";
import type { PaperSize } from "@/utils/print-documents";

interface PrintMenuProps {
  /** Print at the chosen paper size; returns false when the popup was blocked. */
  onPrint: (paper: PaperSize) => boolean;
  /** Label for the A4 option (e.g. "Invoice", "Purchase Order"). */
  a4Label?: string;
}

/**
 * Print button + paper-size menu (A4 / thermal 80mm / 58mm). Selecting an item
 * calls `onPrint` synchronously (inside the click) so the print popup isn't
 * blocked; a blocked popup surfaces a toast.
 */
export function PrintMenu({ onPrint, a4Label = "A4" }: PrintMenuProps) {
  const run = (paper: PaperSize) => {
    if (!onPrint(paper)) toast.error("Please allow pop-ups to print.");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => run("a4")}>{a4Label} (A4)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("thermal80")}>Receipt (80mm)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("thermal58")}>Receipt (58mm)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
