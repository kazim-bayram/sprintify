import { LabelManager } from "@/components/labels/label-manager";

export const metadata = {
  title: "Labels — Sprintify",
};

export default function LabelsPage() {
  return (
    <div className="p-6">
      <LabelManager />
    </div>
  );
}
