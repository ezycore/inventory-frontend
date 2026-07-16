"use client";
// coding-standard: maintained

import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";

export interface AnnouncementDraft {
  enabled: boolean;
  text: string;
  link: string;
  bgColor: string;
}

/** Customize → Navigation → the single-line bar above the storefront header. */
export function AnnouncementCard({
  value,
  onChange,
}: {
  value: AnnouncementDraft;
  onChange: (patch: Partial<AnnouncementDraft>) => void;
}) {
  return (
    <Card className="space-y-4 p-5 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Announcement bar</h3>
          <p className="text-xs text-muted-foreground">
            A single line shown at the top of every storefront page.
          </p>
        </div>
        <Switch
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
          aria-label="Enable announcement bar"
        />
      </div>
      {value.enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Text</Label>
            <Input
              value={value.text}
              onChange={(e) => onChange({ text: e.target.value })}
              maxLength={200}
              placeholder="Free delivery on orders over ৳2000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Link (optional)</Label>
            <Input
              value={value.link}
              onChange={(e) => onChange({ link: e.target.value })}
              placeholder="/products"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Background color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value.bgColor}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="h-9 w-12 flex-none rounded border"
                aria-label="Announcement background color"
              />
              <Input
                value={value.bgColor}
                onChange={(e) => onChange({ bgColor: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
