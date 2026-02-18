import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Privacy Policy — Sprintify",
  description: "Sprintify Privacy Policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  redirect("/legal/privacy");
}
