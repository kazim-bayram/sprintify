import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Users, Tags, Building2, Shield } from "lucide-react";

export const metadata = {
  title: "Settings — Sprintify",
};

const settingsSections = [
  {
    name: "Members",
    description: "Manage team members, roles, and invitations.",
    href: "/settings/members",
    icon: Users,
  },
  {
    name: "Labels",
    description: "Manage organization-wide labels and colors.",
    href: "/settings/labels",
    icon: Tags,
  },
  {
    name: "Admin Settings",
    description: "Configure workflows, columns, WIP limits, and custom fields.",
    href: "/admin/settings",
    icon: Shield,
  },
  {
    name: "Organization",
    description: "Update organization name and settings.",
    href: "/settings",
    icon: Building2,
    disabled: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization, members, and preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Link
            key={section.name}
            href={section.disabled ? "#" : section.href}
            className={section.disabled ? "pointer-events-none opacity-50" : ""}
          >
            <Card className="p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{section.name}</h3>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
