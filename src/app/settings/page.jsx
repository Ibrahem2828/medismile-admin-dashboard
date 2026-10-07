"use client";

import AnimatedWrapper from "@/components/AnimatedWrapper";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRtl } from "@/hooks/useRtl";
import { UserRound, Save } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";

const labelClass = "mb-1.5 block text-caption font-semibold text-muted";

export default function SettingsPage() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const [currentUser, setCurrentUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")); // توحيد المفتاح
    if (user) {
      setCurrentUser(user);
      setFullName(user.name || "");
      setEmail(user.email || "");
      setProfileImage(user.image || null);
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newPassword && currentPassword !== currentUser.password) {
      setMessageType("danger");
      setMessage(t("Settings.wrongPassword"));
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: fullName,
      email,
      password: newPassword ? newPassword : currentUser.password,
      image: profileImage,
    };

    // تحديث users
    let users = JSON.parse(localStorage.getItem("users")) || [];
    users = users.map((u) => (u.email === currentUser.email ? updatedUser : u));

    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("user", JSON.stringify(updatedUser)); // توحيد المفتاح
    setCurrentUser(updatedUser);

    window.dispatchEvent(new Event("user-login"));

    setMessageType("success");
    setMessage(t("Settings.savedSuccessfully"));
  };

  if (!currentUser)
    return (
      <div className={`flex h-full items-center justify-center px-4 mt-20 ${isRtl ? "text-right" : "text-left"}`}>
        <Card className="max-w-md w-full text-center">
          <p className="text-body-sm text-muted">
            {t("Settings.pleaseLogin")}
          </p>
        </Card>
      </div>
    );

  const initial =
    (fullName && fullName[0]?.toUpperCase()) ||
    (email && email[0]?.toUpperCase()) ||
    "U";

  return (
    <AnimatedWrapper>
      <div className={`p-4 sm:p-6 lg:p-8 ${isRtl ? "text-right" : "text-left"}`}>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-h1 text-text">{t("Settings.title")}</h1>
            <p className="text-body-sm text-text-secondary">
              {t("Settings.description") || "إدارة بيانات الملف الشخصي"}
            </p>
          </div>

          <Card>
            {message ? (
              <div
                className={`mb-5 rounded-md border px-4 py-3 text-body-sm font-medium ${
                  messageType === "danger"
                    ? "border-danger/40 bg-danger/10 text-danger"
                    : "border-success/30 bg-success/10 text-success"
                }`}
              >
                {message}
              </div>
            ) : null}

            <form onSubmit={handleSave} className="space-y-5">
              <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${isRtl ? "sm:flex-row-reverse" : ""}`}>
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-20 w-20 rounded-lg border-2 border-primary object-cover"
                  />
                ) : (
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-lg bg-primary text-2xl font-bold text-primary-foreground">
                    {initial}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <label className={labelClass}>
                    <span className={`inline-flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <UserRound size={14} className="text-primary" aria-hidden />
                      {t("Settings.profileImage") || "صورة الملف الشخصي"}
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-caption text-text-secondary file:me-3 file:rounded-md file:border-0 file:bg-primary-muted file:px-3 file:py-2 file:text-caption file:font-semibold file:text-primary hover:file:bg-primary/15"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("Settings.fullName")}</label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>{t("Settings.email")}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("Settings.currentPassword")}</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>{t("Settings.newPassword")}</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <Button type="submit">
                  <Save size={18} />
                  {t("Settings.saveChanges")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AnimatedWrapper>
  );
}
