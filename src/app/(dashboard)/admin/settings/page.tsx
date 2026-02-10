import { AdminSettingsView } from "@/components/admin/admin-settings-view";

export const metadata = {
  title: "Admin Settings — Sprintify NPD",
};

export default function AdminSettingsPage() {
  return (
    <div className="p-6">
      <AdminSettingsView />
    </div>
  );
}
