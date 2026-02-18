import { TemplateEngine } from "@/components/admin/template-engine";

export const metadata = {
  title: "Templates — Sprintify",
};

export default function AdminTemplatesPage() {
  return (
    <div className="p-6">
      <TemplateEngine />
    </div>
  );
}

