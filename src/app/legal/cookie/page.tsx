import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Sprintify",
  description:
    "Sprintify Cookie Policy. Learn how cookies are used for authentication and analytics on sprintify.org.",
};

const LAST_UPDATED = "February 18, 2026";

export default function CookiePolicyPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p>
        <strong>Last updated:</strong> {LAST_UPDATED}
      </p>

      <p>
        This Cookie Policy explains how Sprintify uses cookies and similar
        technologies on <a href="https://sprintify.org">sprintify.org</a>.
        Cookies are small text files stored on your device that help websites
        work properly and (in some cases) provide usage analytics.
      </p>

      <h2>1. Cookies we use</h2>

      <h3>1.1 Essential cookies (required)</h3>
      <p>
        Sprintify uses essential cookies for authentication and session
        management. These cookies are required for the Service to function and
        are used by Supabase Auth to keep you signed in and to help protect your
        account. If you block these cookies, you may not be able to access
        authenticated features.
      </p>

      <h3>1.2 Analytics cookies</h3>
      <p>
        Sprintify uses Vercel Analytics to understand performance and usage
        patterns (for example, page load times and feature usage). This helps us
        improve reliability and user experience.
      </p>

      <h2>2. Your choices and consent</h2>
      <p>
        By using sprintify.org, you agree to the use of essential cookies. Where
        required by applicable law, Sprintify will request consent before using
        non-essential cookies (including analytics cookies) and will provide
        options to manage preferences.
      </p>

      <h2>3. How to control cookies</h2>
      <p>
        Most browsers allow you to control cookies through their settings,
        including deleting existing cookies and blocking future cookies. Note
        that blocking essential cookies may prevent the Service from working
        properly.
      </p>

      <h2>4. Contact</h2>
      <p>
        Questions about this Cookie Policy can be sent to{" "}
        <a href="mailto:support@sprintify.org">support@sprintify.org</a>.
      </p>
    </>
  );
}
