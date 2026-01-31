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
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useMemo } from "react";

const CardWithContent = ({
  title,
  description,
  icon: Icon,
  cardContent,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  cardContent: React.ReactNode;
}) => (
  <Card className="border-2">
    <CardHeader className="border-b bg-muted/30">
      <CardTitle className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="pt-6">{cardContent}</CardContent>
  </Card>
);

const tabItems = [
  {
    value: "profile",
    title: "Profile",
    description: "Update your personal information and contact details",
    icon: User,
    content: <ProfileInfoTab />,
  },
  { 
    value: "password",
    title: "Change Password",
    description: "Update your password to keep your account secure",
    icon: Lock,
    content: <PasswordChangeTab />,
  },
  {
    value: "2fa",
    title: "Two-Factor Authentication",
    description: "Enhance your account security with 2FA",
    icon: KeyRound,
    content: <TwoFactorTab />,
  },
  {
    value: "permissions",
    title: "Your Permissions",
    description: "View your role and assigned permissions",
    icon: Shield,
    content: <PermissionsTab />,
  },
  {
    value: "organization",
    title: "Organization Users",
    description: "Manage users within your organization",
    icon: Building2,
    content: <OrganizationTab />,
  },
  {
    value: "transfer",
    title: "Transfer Ownership",
    description: "Transfer ownership of your organization",
    icon: UserCog,
    content: <TransferOwnershipTab />,
  },
];

export default function ProfilePage() {
  const { user } = useAuthStore();
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

          {
          tabItems.map((tab) => {
            if (tab.value === "transfer" && !isOwner) {
              return null;
            }
            return (
              <TabsContent key={tab.value} value={tab.value}>
                <CardWithContent
                  title={tab.title}
                  description={tab.description}
                  icon={tab.icon}
                  cardContent={tab.content}
                />
              </TabsContent>
            );
          })
        }
      </Tabs>
    </div>
  );
}
