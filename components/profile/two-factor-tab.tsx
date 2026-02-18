"use client";

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
import { CheckCircle2, Copy, Key, Shield, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function TwoFactorTab() {
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
        toast.error("Failed to enable 2FA. Please try again.");
      },
    });
  };

  const handleVerify = () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
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
      toast.error("Please enter your password to disable 2FA.");
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
    toast.success("Code copied to clipboard");
  };

  const copyAllBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("All backup codes copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div
              className={`rounded-lg p-3 ${is2FAEnabled ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"}`}
            >
              {is2FAEnabled ? (
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <Shield className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {is2FAEnabled
                  ? "Your account is protected with 2FA"
                  : "Add an extra layer of security to your account"}
              </p>
              {is2FAEnabled && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>2FA is currently enabled</span>
                </div>
              )}
            </div>
          </div>
          <div>
            {is2FAEnabled ? (
              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
              >
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleEnable} disabled={isEnabling}>
                {isEnabling ? "Setting up..." : "Enable 2FA"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Information */}
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          Two-factor authentication adds an additional layer of security to your
          account. In addition to your password, you&apos;ll need to enter a
          code from your authenticator app when signing in.
        </AlertDescription>
      </Alert>

      {/* Enable 2FA Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
      <DialogDescription>
        Scan the QR code below with your authenticator app, then enter the
        6-digit code to complete setup.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* QR Code */}
      {qrCode && (
        <div className="flex flex-col items-center space-y-3">
          <div className="rounded-lg border-2 p-4 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
          </div>
          <div className="w-full min-w-0">
            <Label className="text-xs text-muted-foreground">
              Or enter this code manually:
            </Label>
            <div className="mt-1 flex items-center gap-2 min-w-0">
              <code className="flex-1 min-w-0 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                {secret}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(secret)}
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
        />
      </div>
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => {
          setShowEnableDialog(false);
          setVerificationToken("");
          setQrCode("");
          setSecret("");
        }}
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
      >
        {isVerifying ? "Verifying..." : "Verify & Enable"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Backup Codes</DialogTitle>
            <DialogDescription>
              Store these backup codes in a safe place. You can use them to
              access your account if you lose access to your authenticator app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Important:</strong> Each backup code can only be used
                once. Keep them secure and accessible.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="rounded bg-muted px-3 py-2 text-center font-mono text-sm"
                >
                  {code}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={copyAllBackupCodes}
            >
              <Copy className="mr-2 h-4 w-4" />
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
            >
              I&apos;ve Saved My Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false);
                setDisablePassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isDisabling || !disablePassword}
            >
              {isDisabling ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
