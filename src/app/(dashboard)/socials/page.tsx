"use client";

import { SocialsManager } from "@/components/social/SocialsManager";
import { useUserRole } from "@/hooks/useUserRole";

export default function DashboardSocialsPage() {
  const { role } = useUserRole();
  const canManage = role === "admin";

  return (
    <div className="space-y-6">
      <SocialsManager
        title="Socials Management"
        subtitle="Admins can publish. Staff and customers can view published content."
        canManage={canManage}
      />
    </div>
  );
}
