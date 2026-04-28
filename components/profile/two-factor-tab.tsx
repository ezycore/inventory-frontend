"use client";

import {
  use2FAStatus,
  useDisable2FA,
  useEnable2FA,
  useRegenerateRecoveryCodes,
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
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function TwoFactorTab() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [recoveryCodesRemaining, setRecoveryCodesRemaining] = useState<
    number | undefined
  >(undefined);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  /**
   * Phase 3.3c — YoCore returns an enrolmentId from `/2fa/enable` that must
   * be echoed back to `/2fa/verify`. Legacy auth ignores it.
   */
  const [enrolmentId, setEnrolmentId] = useState<string | undefined>(undefined);
  const [verificationToken, setVerificationToken] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const { mutate: checkStatus } = use2FAStatus();
  const { mutate: enable2FA, isPending: isEnabling } = useEnable2FA();
  const { mutate: verify2FA, isPending: isVerifying } = useVerify2FA();
  const { mutate: disable2FA, isPending: isDisabling } = useDisable2FA();
  const {
    mutate: regenerateRecoveryCodes,
    isPending: isRegenerating,
  } = useRegenerateRecoveryCodes();

  useEffect(() => {
    checkStatus(undefined, {
      onSuccess: (data) => {
        setIs2FAEnabled(data.enabled);
        setRecoveryCodesRemaining(data.recoveryCodesRemaining);
      },
    });
  }, [checkStatus]);

  const handleEnable = () => {
    enable2FA(undefined, {
      onSuccess: (data) => {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setEnrolmentId(data.enrolmentId);
        setShowEnableDialog(true);
      },
      onError: () => {
        toast.error("Failed to enable 2FA. Please try again.");
      },
    });
  };

  const handleVerify = () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    verify2FA(
      { token: verificationToken, enrolmentId },
      {
        onSuccess: (response) => {
          setBackupCodes(response.data.backupCodes);
          setShowBackupCodes(true);
          setIs2FAEnabled(true);
          setVerificationToken("");
          setQrCode("");
          setSecret("");
          setEnrolmentId(undefined);
        },
      },
    );
  };

  const handleDisable = () => {
    if (!disablePassword) {
      toast.error("Please enter your password to disable 2FA.");
      return;
    }

    disable2FA(disablePassword, {
      onSuccess: () => {
        setIs2FAEnabled(false);
        setRecoveryCodesRemaining(undefined);
        setShowDisableDialog(false);
        setDisablePassword("");
      },
    });
  };

  const handleRegenerateRecoveryCodes = () => {
    regenerateRecoveryCodes(undefined, {
      onSuccess: (response) => {
        setBackupCodes(response.data.backupCodes);
        setShowRegenerateDialog(false);
        setShowBackupCodes(true);
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const copyAllBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("All backup codes copied to clipboard");
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
              Two-Factor Authentication
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {is2FAEnabled
                ? "Your account is protected with an additional layer of security."
                : "Add an extra layer of security by requiring a verification code when signing in."}
            </p>

            {is2FAEnabled && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-sm text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>2FA is active</span>
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
                <span className="hidden sm:inline">Disable 2FA</span>
                <span className="sm:hidden">Disable</span>
              </Button>
            ) : (
              <Button onClick={handleEnable} disabled={isEnabling} className="gap-2">
                {isEnabling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Enable 2FA</span>
                <span className="sm:hidden">Enable</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* How it works Section */}
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          How it works
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Download App",
              desc: "Get an authenticator app like Google Authenticator or Authy",
            },
            {
              step: "2",
              title: "Scan QR Code",
              desc: "Scan the QR code with your authenticator app",
            },
            {
              step: "3",
              title: "Enter Code",
              desc: "Enter the 6-digit code from your app to verify",
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
          Two-factor authentication adds a second verification step when signing
          in. Even if someone gets your password, they won&apos;t be able to
          access your account without the verification code.
        </AlertDescription>
      </Alert>

      {/* Recovery Codes Section (only when 2FA is enabled) */}
      {is2FAEnabled && (
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Recovery Codes
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Use these one-time codes to sign in if you lose access to your
                authenticator app.
              </p>
              {recoveryCodesRemaining !== undefined && (
                <p
                  className={cn(
                    "mt-2 text-sm",
                    recoveryCodesRemaining <= 2
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {recoveryCodesRemaining} code
                  {recoveryCodesRemaining === 1 ? "" : "s"} remaining
                  {recoveryCodesRemaining <= 2 &&
                    " — regenerate now to avoid being locked out."}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(true)}
              disabled={isRegenerating}
              className="gap-2 shrink-0"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Regenerate Codes</span>
              <span className="sm:hidden">Regenerate</span>
            </Button>
          </div>
        </div>
      )}

      {/* Enable 2FA Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the
              verification code.
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
                    Or enter this code manually:
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
              <Label htmlFor="verify-code">Verification Code</Label>
              <Input
                id="verify-code"
                placeholder="Enter 6-digit code"
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
              Cancel
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
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Backup Codes</DialogTitle>
            <DialogDescription>
              Store these codes safely. Use them to access your account if you
              lose your authenticator device.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Important:</strong> Each code can only be used once.
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
              Copy All Codes
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
              I&apos;ve Saved My Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Recovery Codes Dialog */}
      <Dialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerate Recovery Codes</DialogTitle>
            <DialogDescription>
              This will invalidate your existing recovery codes and generate a
              fresh set. Make sure to save the new codes — you will not be
              able to use the old ones again.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Tip:</strong> Regenerate codes if you have used most of
              your existing ones, or if you suspect they have been exposed.
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateRecoveryCodes}
              disabled={isRegenerating}
              className="w-full sm:w-auto gap-2"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to disable 2FA. This will make your account
              less secure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Password</Label>
              <Input
                id="disable-password"
                type="password"
                placeholder="Enter your password"
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
              Cancel
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
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
