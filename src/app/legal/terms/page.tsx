import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Sprintify",
  description:
    "Sprintify Terms of Service. Rules and conditions for using sprintify.org.",
};

const LAST_UPDATED = "February 18, 2026";

export default function TermsOfServicePage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>
        <strong>Last updated:</strong> {LAST_UPDATED}
      </p>

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
        use of Sprintify (the &ldquo;Service&rdquo;), available at{" "}
        <a href="https://sprintify.org">sprintify.org</a>. By accessing or using
        the Service, you agree to be bound by these Terms. If you do not agree,
        do not use the Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        Sprintify is a SaaS project management tool designed to help individuals
        and teams plan, track, and deliver work using Agile, Waterfall, and
        Hybrid workflows. The Service may evolve over time, and features may be
        added, removed, or changed.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <ul>
        <li>
          You must provide accurate information when creating an account and
          keep it up to date.
        </li>
        <li>
          You are responsible for maintaining the security of your account and
          for all activity that occurs under your credentials.
        </li>
        <li>
          You may not use the Service for any unlawful purpose or in a way that
          violates these Terms.
        </li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>
        You agree not to misuse the Service. For example, you must not:
      </p>
      <ul>
        <li>Send spam, phishing, or other unsolicited messages.</li>
        <li>Upload or share illegal content.</li>
        <li>
          Attempt to bypass security controls, interfere with the Service, or
          access accounts or data that you do not have permission to access.
        </li>
        <li>
          Reverse engineer, decompile, or attempt to extract source code from
          the Service except to the extent such restrictions are prohibited by
          applicable law.
        </li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You (and your organization, if applicable) retain ownership of the data
        you submit to the Service, including project information, tasks, and
        collaboration content (&ldquo;Customer Content&rdquo;). You grant
        Sprintify a limited, non-exclusive, worldwide license to host, store,
        process, transmit, and display Customer Content solely to provide,
        maintain, and improve the Service.
      </p>

      <h2>5. Third-party services</h2>
      <p>
        The Service may rely on third-party providers (for example, Supabase and
        Vercel). Your use of third-party services may be subject to their terms.
        Sprintify is not responsible for third-party services that are outside
        our control.
      </p>

      <h2>6. Service provided &ldquo;AS IS&rdquo;</h2>
      <p>
        The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS
        AVAILABLE&rdquo; basis, without warranties of any kind, whether express,
        implied, or statutory, including warranties of merchantability, fitness
        for a particular purpose, title, and non-infringement. Sprintify does
        not warrant that the Service will be uninterrupted, error-free, or
        secure.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, Sprintify and its
        affiliates, officers, employees, agents, and suppliers will not be
        liable for any indirect, incidental, special, consequential, or punitive
        damages, or any loss of profits, revenues, data, goodwill, or other
        intangible losses, arising out of or related to your use of (or
        inability to use) the Service.
      </p>
      <p>
        To the maximum extent permitted by applicable law, Sprintify&apos;s
        total liability for all claims relating to the Service will not exceed
        the amounts you paid to Sprintify for the Service in the twelve (12)
        months immediately preceding the event giving rise to the claim (or, if
        you have not paid anything, USD $100).
      </p>

      <h2>8. Suspension and termination</h2>
      <p>
        We reserve the right to suspend or terminate your access to the Service
        at any time if we reasonably believe you have violated these Terms or
        used the Service for abuse, including spam, illegal content, or attempts
        to compromise security.
      </p>
      <p>
        You may stop using the Service at any time. If you would like your data
        deleted, please contact{" "}
        <a href="mailto:support@sprintify.org">support@sprintify.org</a>.
      </p>

      <h2>9. Payments and plans</h2>
      <p>
        The Service is currently offered free of charge. Sprintify reserves the
        right to introduce paid plans, fees, or usage limits in the future. If
        we do so, we will provide reasonable notice before changes take effect,
        and we will update these Terms and/or publish plan details on
        sprintify.org.
      </p>

      <h2>10. Changes to the Service or Terms</h2>
      <p>
        We may modify the Service or these Terms from time to time. We will post
        the updated Terms on this page and update the &ldquo;Last
        updated&rdquo; date. If changes are material, we may provide additional
        notice. Your continued use of the Service after changes become
        effective constitutes acceptance of the updated Terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:support@sprintify.org">support@sprintify.org</a>.
      </p>
    </>
  );
}
