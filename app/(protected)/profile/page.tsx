"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
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
import { useAuthStore } from "@/stores/use-auth-store";
import { useMemo } from "react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isOwner = useMemo(() => {
    return user?.organization?.ownerId === user?.id;
  }, [user?.firstName]);
  
  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* Header Card */}
      <ProfileHeader />

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full h-auto p-1" style={{ gridTemplateColumns: `repeat(${isOwner ? 6 : 5}, minmax(0, 1fr))` }}>
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger 
            value="password" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Password</span>
          </TabsTrigger>
          <TabsTrigger 
            value="2fa" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">2FA</span>
          </TabsTrigger>
          <TabsTrigger 
            value="permissions" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger 
            value="organization" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger 
              value="transfer" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Transfer</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <User className="h-5 w-5 text-primary" />
                </div>
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ProfileInfoTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <PasswordChangeTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2FA Tab */}
        <TabsContent value="2fa">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Enhance your account security with 2FA
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <TwoFactorTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                Your Permissions
              </CardTitle>
              <CardDescription>
                View your role and assigned permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <PermissionsTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                Organization Settings
              </CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Manage your organization information and settings"
                  : "View your organization details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <OrganizationTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Ownership Tab - Only for owners */}
        
          <TabsContent value="transfer">
            <Card className="border-2">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <UserCog className="h-5 w-5 text-primary" />
                  </div>
                  Transfer Ownership
                </CardTitle>
                <CardDescription>
                  Transfer organization ownership to another user
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <TransferOwnershipTab />
              </CardContent>
            </Card>
          </TabsContent>
        
      </Tabs>
    </div>
  );
}
