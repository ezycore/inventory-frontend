"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Avatar, AvatarFallback, AvatarImage } from "@ui/components/avatar";
import { Button } from "@/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { Badge } from "@/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import {
  User,
  Lock,
  Shield,
  Settings,
  Camera,
  Eye,
  EyeOff,
  Save,
  X,
  Mail,
  Phone,
  Building2,
  Globe,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import {
  useUpdateProfile,
  useUpdatePassword,
  useUpdatePreferences,
  useProfilePermissions,
} from "@/hooks/queries/use-profile";
import { useAuthStore } from "@/stores/use-auth-store";
import { DynamicFormConfig } from "@/ui/components/form/type";
import useDynamicForm from "@/hooks/use-dynamic-form";
import DynamicForm from "@/ui/components/form";
import ProfileForm from "@/components/profile/profile-form";
import SecurityForm from "@/components/profile/security-form";
import PreferenceForm from "@/components/profile/preference-form";

export default function ProfilePage() {
  const { data: permissionsData } = useProfilePermissions();
  const { user, isLoading } = useAuthStore();

  const profileFormConfig = (
    onNameChange?: (name: string) => void,
    onGenerateBarcode?: () => void
  ): DynamicFormConfig => {
    return {
      generateSchema: true,
      layout: {
        maxColumns: 12,
        gap: 4,
        sectionSpacing: 6,
      },
      sections: [
        {
          title: "Personal Information",
          description: "Manage your personal details and contact information.",
          icon: <User className="h-5 w-5 text-blue-600" />,
          collapsible: true,
          defaultOpen: true,
          fields: [
            {
              name: "firstName",
              type: "input",
              label: "First Name",
              columnSpan: 6,
              placeholder: "Enter first name",
            },
            {
              name: "lastName",
              type: "input",
              label: "Last Name",
              columnSpan: 6,
              placeholder: "Enter last name",
            },
            {
              name: "email",
              type: "input",
              label: "Email",
              columnSpan: 6,
              placeholder: "Enter email",
            },
            {
              name: "phone",
              type: "input",
              label: "Phone Number",
              columnSpan: 6,
              placeholder: "Enter phone number",
            },
          ],
        },
        {
          title: "Images",
          icon: <span className="text-orange-600 font-semibold">🖼</span>,
          collapsible: true,
          defaultOpen: true,
          fields: [
            {
              name: "images",
              type: "file-upload",
              zodType: "array",
              arrayOf: "file",
              label: "Product Images",
              columnSpan: 12,
              accept: "image/*",
              maxFiles: 5,
              maxSize: 5 * 1024 * 1024, // 5MB
              multiple: true,
              showPreview: true,
              dropzoneText: "PNG, JPG, GIF up to 5MB (Max 5 images)",
              validation: {
                max: 5,
              },
              optional: true,
            },
          ],
        },
      ],
    };
  };
  const { form, config } = useDynamicForm(profileFormConfig());

  const updatePreferences = useUpdatePreferences();

  // Reset form with user data when user becomes available
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        password: "",
        images: [],
      });
    }
  }, [user?.id, form]);

  const [preferencesForm, setPreferencesForm] = useState<{
    theme: "light" | "dark" | "system";
    currency: string;
    timezone: string;
    language: string;
  } | null>(null);

  const currentPreferencesForm = preferencesForm || {
    theme: user?.preferences?.theme || "system",
    currency: user?.preferences?.currency || "USD",
    timezone: user?.preferences?.timezone || "UTC",
    language: user?.preferences?.language || "en",
  };

  const getInitials = () => {
    const userData = user;
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  // Show loading only if we don't have any user data yet
  if (isLoading && !user) {
    return (
      <div className="container min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-12">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="border-2 border-blue-100 dark:border-blue-900">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800 shadow-lg">
                <AvatarImage src={user?.avatar} alt="Profile" />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Badge
                    variant="default"
                    className="text-sm px-3 py-1 capitalize"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.role || "User"}
                  </Badge>
                  {user && (
                    <Badge
                      variant="outline"
                      className="text-sm px-3 py-1 border-green-500 text-green-600"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{user?.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white dark:bg-gray-800 p-1">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissions</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-2 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Manage your personal details and contact information. 
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-2 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card className="border-2 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Permissions & Access Control
                </CardTitle>
                <CardDescription>
                  View your role and assigned permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Current Role
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your assigned role in the system
                      </p>
                    </div>
                    <Badge className="text-lg px-4 py-2 capitalize bg-blue-600">
                      <Shield className="w-4 h-4 mr-2" />
                      {user?.role || "User"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Granted Permissions
                  </h3>
                  {permissionsData &&
                  permissionsData.permissions &&
                  permissionsData.permissions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {permissionsData.permissions.map((permission: string) => (
                        <div
                          key={permission}
                          className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">
                            {permission}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No permissions assigned
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Contact your administrator for access
                      </p>
                    </div>
                  )}
                </div>

                {user?.role === "admin" && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-sm text-amber-900 dark:text-amber-100">
                          Administrator Access
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          You have full administrative privileges with access to
                          all features and settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="border-2 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Application Preferences
                </CardTitle>
                <CardDescription>
                  Customize your application experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PreferenceForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
