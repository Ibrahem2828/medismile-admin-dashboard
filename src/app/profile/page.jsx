"use client";

import AnimatedWrapper from "@/components/AnimatedWrapper";
import { Badge, Card } from "@/components/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchUniversityAdminProfile } from "@/services/universityApi";
import { useRole } from "@/hooks/useRole";
import { useRtl } from "@/hooks/useRtl";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building2,
  Briefcase,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

function InfoTile({ icon: Icon, label, value, isRtl, mono = false }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-border bg-background p-4 ${
        isRtl ? "flex-row-reverse" : ""
      }`}
    >
      <Icon size={20} className="mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-caption font-semibold text-muted">{label}</p>
        <p
          className={`font-semibold text-text ${
            mono ? "font-mono text-caption" : ""
          } whitespace-pre-line leading-relaxed`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useRole();
  const isRtl = useRtl();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        if (user?.role === "university_admin" || user?.role === "college_admin") {
          const profileData = await fetchUniversityAdminProfile();
          setProfile(profileData);
        } else {
          const localUser = JSON.parse(localStorage.getItem("user") || "null");
          setProfile(localUser);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error(t("Profile.loadError"));
        const localUser = JSON.parse(localStorage.getItem("user") || "null");
        setProfile(localUser);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user, t]);

  if (loading) {
    return (
      <AnimatedWrapper>
        <div className="mt-20 flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AnimatedWrapper>
    );
  }

  if (!profile) {
    return (
      <AnimatedWrapper>
        <div className="mt-20 flex h-full items-center justify-center">
          <p className="text-body-sm text-muted">{t("Profile.pleaseLogin")}</p>
        </div>
      </AnimatedWrapper>
    );
  }

  const fullName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.name ||
        profile.username ||
        profile.email?.split("@")[0] ||
        t("Profile.user");

  const fallbackInitial =
    fullName[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U";

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatGender = (gender) => {
    if (!gender) return "-";
    const genderMap = {
      male: t("Profile.male"),
      female: t("Profile.female"),
    };
    return genderMap[gender] || gender;
  };

  return (
    <AnimatedWrapper>
      <div
        className={`mx-auto min-h-screen max-w-4xl bg-background p-4 sm:p-6 lg:p-8 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <Card padding={false} className="overflow-hidden">
          <div className="bg-primary p-6 sm:p-8">
            <div
              className={`flex flex-col items-center gap-6 sm:flex-row ${
                isRtl ? "sm:flex-row-reverse" : ""
              }`}
            >
              {profile.profile_picture ? (
                <div className="h-24 w-24 rounded-full border-2 border-primary-foreground/40 bg-surface p-1 shadow-lg sm:h-32 sm:w-32">
                  <img
                    src={profile.profile_picture}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15 text-4xl font-bold text-primary-foreground shadow-lg sm:h-32 sm:w-32 sm:text-5xl">
                  {fallbackInitial}
                </div>
              )}
              <div
                className={`flex-1 text-center ${
                  isRtl ? "sm:text-right" : "sm:text-left"
                }`}
              >
                <h1 className="mb-2 text-h1 text-primary-foreground">
                  {fullName}
                </h1>
                <p
                  className={`flex items-center gap-2 text-body-sm text-primary-foreground/85 sm:text-base ${
                    isRtl
                      ? "flex-row-reverse justify-center sm:justify-end"
                      : "justify-center sm:justify-start"
                  }`}
                >
                  <Mail size={18} className="shrink-0" />
                  {profile.email}
                </p>
                {profile.role && (
                  <Badge
                    variant="default"
                    className="mt-3 border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground"
                  >
                    {profile.role === "university_admin"
                      ? t("Profile.universityAdmin")
                      : profile.role}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6 sm:p-8">
            <div>
              <h2
                className={`mb-5 flex items-center gap-2 text-h3 text-text ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                <User size={20} className="shrink-0 text-primary" />
                {t("Profile.contactInfo")}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {profile.phone_number && (
                  <InfoTile
                    icon={Phone}
                    label={t("Profile.phoneNumber")}
                    value={profile.phone_number}
                    isRtl={isRtl}
                  />
                )}
                {profile.address && (
                  <InfoTile
                    icon={MapPin}
                    label={t("Profile.address")}
                    value={profile.address}
                    isRtl={isRtl}
                  />
                )}
                {profile.date_of_birth && (
                  <InfoTile
                    icon={Calendar}
                    label={t("Profile.dateOfBirth")}
                    value={formatDate(profile.date_of_birth)}
                    isRtl={isRtl}
                  />
                )}
                {profile.gender && (
                  <InfoTile
                    icon={Users}
                    label={t("Profile.gender")}
                    value={formatGender(profile.gender)}
                    isRtl={isRtl}
                  />
                )}
              </div>
            </div>

            {(profile.university_name ||
              profile.department ||
              profile.position) && (
              <div>
                <h2
                  className={`mb-5 flex items-center gap-2 text-h3 text-text ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <Briefcase size={20} className="shrink-0 text-primary" />
                  {t("Profile.workInfo")}
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {profile.university_name && (
                    <InfoTile
                      icon={Building2}
                      label={t("Profile.university")}
                      value={profile.university_name}
                      isRtl={isRtl}
                    />
                  )}
                  {profile.department && (
                    <InfoTile
                      icon={Briefcase}
                      label={t("Profile.department")}
                      value={profile.department}
                      isRtl={isRtl}
                    />
                  )}
                  {profile.position && (
                    <InfoTile
                      icon={User}
                      label={t("Profile.position")}
                      value={profile.position}
                      isRtl={isRtl}
                    />
                  )}
                </div>
              </div>
            )}

            <div>
              <h2
                className={`mb-5 flex items-center gap-2 text-h3 text-text ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                <Mail size={20} className="shrink-0 text-primary" />
                {t("Profile.accountInfo")}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoTile
                  icon={Mail}
                  label={t("Profile.email")}
                  value={profile.email}
                  isRtl={isRtl}
                />
                {profile.user_id && (
                  <InfoTile
                    icon={User}
                    label={t("Profile.userId")}
                    value={profile.user_id}
                    isRtl={isRtl}
                    mono
                  />
                )}
                {profile.created_at && (
                  <InfoTile
                    icon={Calendar}
                    label={t("Profile.createdAt")}
                    value={formatDate(profile.created_at)}
                    isRtl={isRtl}
                  />
                )}
                {profile.updated_at && (
                  <InfoTile
                    icon={Calendar}
                    label={t("Profile.updatedAt")}
                    value={formatDate(profile.updated_at)}
                    isRtl={isRtl}
                  />
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AnimatedWrapper>
  );
}
