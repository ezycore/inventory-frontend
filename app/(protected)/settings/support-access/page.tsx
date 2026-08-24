"use client";
// coding-standard: maintained
import { ShieldCheck } from "lucide-react";

import { SupportSessionList } from "@/components/support/support-session-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";

/**
 * Settings → Support access: every time someone at EzyCore opened this
 * workspace (`mission-control/plan/support-session.md` §5).
 *
 * The page is the permanent half of the transparency promise; the banner is the
 * live half. Both matter — a banner nobody was looking at when it appeared
 * would otherwise leave no trace a merchant could check afterwards.
 */
export default function SupportAccessSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support access"
        subTitle="When EzyCore support has opened your workspace, and why."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            How support access works
          </CardTitle>
          <CardDescription>
            To help with a support request, our team can open your workspace for
            30 minutes. They can <strong>only read</strong> — nothing can be
            changed, and payment details and security settings stay hidden. You
            see a banner the whole time, and you can end a session from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupportSessionList />
        </CardContent>
      </Card>
    </div>
  );
}
