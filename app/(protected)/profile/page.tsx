"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { User, Lock, Shield, Building2, KeyRound, UserCog } from "lucide-react";
import {
  ProfileHeader,
  ProfileInfoTab,
  PasswordChangeTab,
  PermissionsTab,
  OrganizationTab,
  TwoFactorTab,
  TransferOwnershipTab,
} from "@/components/profile";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useMemo, useState } from "react";
import { ScrollArea, ScrollBar } from "@/ui/components/scroll-area";
import { cn } from "@/ui/lib/utils";

const tabItems = [
  {
    value: "profile",
    title: "Profile",
    shortTitle: "Profile",
    description: "Update your personal information",
    icon: User,
    content: <ProfileInfoTab />,
  },
  {
    value: "password",
    title: "Password",
    shortTitle: "Password",
    description: "Change your account password",
    icon: Lock,
    content: <PasswordChangeTab />,
  },
  {
    value: "2fa",
    title: "Two-Factor Auth",
    shortTitle: "2FA",
    description: "Enhance account security",
    icon: KeyRound,
    content: <TwoFactorTab />,
  },
  {
    value: "permissions",
    title: "Permissions",
    shortTitle: "Permissions",
    description: "View your access rights",
    icon: Shield,
    content: <PermissionsTab />,
  },
  {
    value: "organization",
    title: "Organization",
    shortTitle: "Org",
    description: "Manage organization settings",
    icon: Building2,
    content: <OrganizationTab />,
  },
  {
    value: "transfer",
    title: "Transfer",
    shortTitle: "Transfer",
    description: "Transfer ownership",
    icon: UserCog,
    content: <TransferOwnershipTab />,
    ownerOnly: true,
  },
];

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");

  const isOwner = useMemo(() => {
    return user?.organization?.ownerId === user?.id;
  }, [user?.organization?.ownerId, user?.id]);

  const visibleTabs = tabItems.filter((tab) => !tab.ownerOnly || isOwner);
  const activeTabData = visibleTabs.find((tab) => tab.value === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Header */}
        <ProfileHeader />

        {/* Main Content */}
        <div className="mt-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-0"
          >
            {/* Desktop Sidebar + Content Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Navigation - Desktop */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-6">
                  <nav className="space-y-1 rounded-xl border bg-card p-2">
                    <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
                      {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className={cn(
                              "w-full justify-start gap-3 px-4 py-3 text-left font-medium",
                              "rounded-lg transition-all",
                              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                              "hover:bg-muted data-[state=active]:hover:bg-primary"
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
                    {visibleTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg shrink-0",
                            "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                            "transition-all"
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
                {visibleTabs.map((tab) => (
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
