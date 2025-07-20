"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Trash2, Download } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { exportAllUserData } from "./actions";
import { useRouter } from "@/i18n/routing";

export function AccountSettings() {
  const t = useTranslations("settings.account");
  const session = authClient.useSession();
  const router = useRouter();

  const [updateInProgress, setUpdateInProgress] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmail, setEmail] = useState("");

  async function updateUserInformation() {
    try {
      setUpdateInProgress(true);
      if (newDisplayName !== "") {
        await authClient.updateUser({
          name: newDisplayName,
        });
        setNewDisplayName("");
      }
      if (newEmail !== "") {
        await authClient.changeEmail({
          newEmail: newEmail,
        });
        setEmail("");
      }
      setUpdateInProgress(false);
      toast.success(t("userInformationUpdated"));
    } catch {
      setUpdateInProgress(false);
      toast.error(t("failedToUpdateUserInformation"));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profileInformation")}</CardTitle>
          <CardDescription>
            {t("updateYourPersonalInformation")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="display-name">{t("displayName")}</Label>
            <Input
              id="display-name"
              placeholder={t("displayNamePlaceholder")}
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={newEmail}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button disabled={updateInProgress} onClick={updateUserInformation}>
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("dataExport")}
          </CardTitle>
          <CardDescription>{t("dataExportDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t("dataExportInfo")}
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                if (!session.data?.user.id) {
                  toast.error(t("userNotLoggedIn"));
                  return;
                }
                const userData = await exportAllUserData(session.data?.user.id);
                toast.success(t("requestDataExportSuccess"));
                const blob = new Blob([JSON.stringify(userData, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `user_data_${session.data?.user.id}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch {
                toast.error(t("failedToExportData"));
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            {t("requestDataExport")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t("dangerZone")}
          </CardTitle>
          <CardDescription>
            {t("irreversibleAndDestructiveActions")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-destructive">
                {t("deleteAccount")}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t("deleteAccountDescription")}
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t("deleteAccount")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    {t("areYouAbsolutelySure")}
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2">
                      <p>{t("thisActionCannotBeUndone")}</p>
                      <p className="font-medium">
                        {t("type")}{" "}
                        <span className="font-mono bg-muted px-1 rounded">
                          DELETE
                        </span>{" "}
                        {t("toConfirm")}:
                      </p>
                      <Input
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder={t("deleteConfirmationPlaceholder")}
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteConfirmation !== "DELETE"}
                    onClick={async () => {
                      setDeleteConfirmation("");
                      await authClient.deleteUser();
                      router.push("/");
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("deleteAccount")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
