"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  use2FAStatus,
  useDisable2FA,
  useEnable2FA,
  useVerify2FA,
} from "@/services/api";
import { Alert, AlertDescription } from "@/ui/components/alert";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { cn } from "@/ui/lib/utils";
import {
  CheckCircle2,
  Copy,
  Key,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function TwoFactorTab() {
  const t = useTranslations("settings.profile.twoFactor");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationToken, setVerificationToken] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const { mutate: checkStatus } = use2FAStatus();
  const { mutate: enable2FA, isPending: isEnabling } = useEnable2FA();
  const { mutate: verify2FA, isPending: isVerifying } = useVerify2FA();
  const { mutate: disable2FA, isPending: isDisabling } = useDisable2FA();

  useEffect(() => {
    checkStatus(undefined, {
      onSuccess: (data) => {
        setIs2FAEnabled(data.enabled);
      },
    });
  }, [checkStatus]);

  const handleEnable = () => {
    enable2FA(undefined, {
      onSuccess: (data) => {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShowEnableDialog(true);
      },
      onError: () => {
        toast.error(t("enableError"));
      },
    });
  };

  const handleVerify = () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast.error(t("invalidCodeError"));
      return;
    }

    verify2FA(verificationToken, {
      onSuccess: (response) => {
        setBackupCodes(response.data.backupCodes);
        setShowBackupCodes(true);
        setIs2FAEnabled(true);
        setVerificationToken("");
        setQrCode("");
        setSecret("");
      },
    });
  };

  const handleDisable = () => {
    if (!disablePassword) {
      toast.error(t("passwordRequiredError"));
      return;
    }

    disable2FA(disablePassword, {
      onSuccess: () => {
        setIs2FAEnabled(false);
        setShowDisableDialog(false);
        setDisablePassword("");
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  };

  const copyAllBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success(t("allCodesCopied"));
  };

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <div
        className={cn(
          "rounded-lg border-2 p-4 sm:p-6 transition-colors",
          is2FAEnabled
            ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
            : "border-muted bg-muted/30"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl mx-auto sm:mx-0",
              is2FAEnabled
                ? "bg-green-100 dark:bg-green-900/40"
                : "bg-muted"
            )}
          >
            {is2FAEnabled ? (
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-semibold">
              {t("title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {is2FAEnabled
                ? t("enabledDescription")
                : t("disabledDescription")}
            </p>

            {is2FAEnabled && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-sm text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t("active")}</span>
              </div>
            )}
          </div>

          <div className="flex justify-center sm:justify-end">
            {is2FAEnabled ? (
              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
                className="gap-2"
              >
                <ShieldOff className="h-4 w-4" />
                <span className="hidden sm:inline">{t("disable")}</span>
                <span className="sm:hidden">{t("disableShort")}</span>
              </Button>
            ) : (
              <Button onClick={handleEnable} disabled={isEnabling} className="gap-2">
                {isEnabling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{t("enable")}</span>
                <span className="sm:hidden">{t("enableShort")}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* How it works Section */}
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          {t("howItWorks")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: t("steps.download"),
              desc: t("steps.downloadDescription"),
            },
            {
              step: "2",
              title: t("steps.scan"),
              desc: t("steps.scanDescription"),
            },
            {
              step: "3",
              title: t("steps.enter"),
              desc: t("steps.enterDescription"),
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {item.step}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Information Alert */}
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription className="text-sm">
          {t("infoAlert")}
        </AlertDescription>
      </Alert>

      {/* Enable 2FA Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("setupTitle")}</DialogTitle>
            <DialogDescription>
              {t("setupDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {qrCode && (
              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="rounded-xl border-2 p-3 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCode}
                      alt="2FA QR Code"
                      className="h-40 w-40 sm:h-48 sm:w-48"
                    />
                  </div>
                </div>

                {/* Manual Code */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("manualCodeLabel")}
                  </Label>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs sm:text-sm font-mono break-all">
                      {secret}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(secret)}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Input */}
            <div className="space-y-2">
              <Label htmlFor="verify-code">{t("verificationCode")}</Label>
              <Input
                id="verify-code"
                placeholder={t("verificationCodePlaceholder")}
                value={verificationToken}
                onChange={(e) =>
                  setVerificationToken(e.target.value.replace(/\D/g, ""))
                }
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEnableDialog(false);
                setVerificationToken("");
                setQrCode("");
                setSecret("");
              }}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleVerify}
              disabled={
                isVerifying ||
                !verificationToken ||
                verificationToken.length !== 6
              }
              className="w-full sm:w-auto"
            >
              {isVerifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("verifyAndEnable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("backupCodesTitle")}</DialogTitle>
            <DialogDescription>
              {t("backupCodesDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                {t.rich("backupCodesWarning", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-muted px-3 py-2 text-center font-mono text-sm"
                >
                  {code}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={copyAllBackupCodes}
            >
              <Copy className="h-4 w-4" />
              {t("copyAllCodes")}
            </Button>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowBackupCodes(false);
                setShowEnableDialog(false);
                setBackupCodes([]);
              }}
              className="w-full sm:w-auto"
            >
              {t("savedCodes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("disableTitle")}</DialogTitle>
            <DialogDescription>
              {t("disableDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">{t("passwordLabel")}</Label>
              <Input
                id="disable-password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false);
                setDisablePassword("");
              }}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isDisabling || !disablePassword}
              className="w-full sm:w-auto"
            >
              {isDisabling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("disable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
