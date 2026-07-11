"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  PasswordChangeTab,
  PermissionsTab,
  ProfileHeader,
  ProfileInfoTab,
  TwoFactorTab,
} from "@/components/profile";
import { ScrollArea, ScrollBar } from "@/ui/components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { cn } from "@/ui/lib/utils";
import type { Translator } from "@/i18n/config";
import { KeyRound, Lock, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

const getTabItems = (t: Translator) => [
  {
    value: "profile",
    title: t("tabs.profile"),
    shortTitle: t("tabs.profile"),
    description: t("tabs.profileDescription"),
    icon: User,
    content: <ProfileInfoTab />,
  },
  {
    value: "password",
    title: t("tabs.password"),
    shortTitle: t("tabs.password"),
    description: t("tabs.passwordDescription"),
    icon: Lock,
    content: <PasswordChangeTab />,
  },
  {
    value: "2fa",
    title: t("tabs.twoFactor"),
    shortTitle: t("tabs.twoFactorShort"),
    description: t("tabs.twoFactorDescription"),
    icon: KeyRound,
    content: <TwoFactorTab />,
  },
  {
    value: "permissions",
    title: t("tabs.permissions"),
    shortTitle: t("tabs.permissions"),
    description: t("tabs.permissionsDescription"),
    icon: Shield,
    content: <PermissionsTab />,
  },
];

const validTabValues = ["profile", "password", "2fa", "permissions"];

// Organization admin moved to Settings → Organization; old profile hashes
// should land there instead of dead-ending.
const legacyOrgHashes = ["organization", "transfer"];

export default function ProfilePage() {
  const t = useTranslations("settings.profile");
  const tabItems = getTabItems(t);
  const router = useRouter();

  // Always start with "profile" — consistent between server render and the
  // client's first (hydration) render, so React never sees a mismatch.
  // The correct hash-based tab is applied in the effect below, which runs
  // after hydration completes (client-only, no SSR execution).
  const [activeTab, setActiveTab] = useState<string>("profile");

  // Apply the URL hash after hydration, and keep in sync with hash changes.
  useLayoutEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (legacyOrgHashes.includes(hash)) {
        router.replace("/settings/organization");
        return;
      }
      if (hash && validTabValues.includes(hash)) {
        setActiveTab(hash);
      } else {
        // No hash, or a hash that isn't a valid tab → reset
        setActiveTab("profile");
      }
    };

    // Sync to current hash immediately on mount
    applyHash();

    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== "undefined") {
      const url = `${window.location.pathname}#${value}`;
      window.history.replaceState(null, "", url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Header */}
        <ProfileHeader />

        {/* Main Content */}
        <div className="mt-6">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-0"
          >
            {/* Desktop Sidebar + Content Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Navigation - Desktop */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-6">
                  <nav className="space-y-1 rounded-xl border bg-card p-2">
                    <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
                      {tabItems.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className={cn(
                              "w-full justify-start gap-3 px-4 py-3 text-left font-medium",
                              "rounded-lg transition-all",
                              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                              "hover:bg-muted data-[state=active]:hover:bg-primary",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <div className="flex flex-col items-start">
                              <span className="text-sm">{tab.title}</span>
                              <span className="text-xs font-normal opacity-70">
                                {tab.description}
                              </span>
                            </div>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </nav>
                </div>
              </aside>

              {/* Mobile Tab Navigation */}
              <div className="lg:hidden">
                <ScrollArea className="w-full whitespace-nowrap">
                  <TabsList className="inline-flex w-full justify-start gap-1 bg-card border rounded-xl p-1.5 h-auto">
                    {tabItems.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg shrink-0",
                            "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                            "transition-all",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {tab.shortTitle}
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
              </div>

              {/* Content Area */}
              <div className="flex-1 min-w-0">
                {tabItems.map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="mt-0 focus-visible:outline-none focus-visible:ring-0"
                  >
                    <div className="rounded-xl border bg-card overflow-hidden">
                      {/* Tab Header */}
                      <div className="border-b bg-muted/30 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <tab.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold">
                              {tab.title}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {tab.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Tab Content */}
                      <div className="p-6">{tab.content}</div>
                    </div>
                  </TabsContent>
                ))}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
