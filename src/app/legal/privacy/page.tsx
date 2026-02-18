import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Sprintify",
  description:
    "Sprintify Privacy Policy. Learn how we collect, use, and protect your data.",
};

const LAST_UPDATED = "February 18, 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        <strong>Last updated:</strong> {LAST_UPDATED}
      </p>

      <p>
        This Privacy Policy explains how Sprintify (&ldquo;Sprintify&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses,
        and shares information when you use our website and services at{" "}
        <a href="https://sprintify.org">sprintify.org</a> (the
        &ldquo;Service&rdquo;). This policy is intended to reflect general data
        protection principles (including transparency, data minimization,
        purpose limitation, security, and accountability) and to help you
        understand your privacy rights.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Sprintify is a SaaS project management tool that supports Agile,
        Waterfall, and Hybrid workflows.
      </p>

      <h2>2. Information we collect</h2>
      <p>
        We collect information that you provide directly, information created
        through your use of the Service, and limited technical information
        necessary to operate and secure the Service.
      </p>

      <h3>2.1 Account and profile information</h3>
      <ul>
        <li>
          <strong>Name</strong> (display name you provide or that may be
          associated with your sign-in method)
        </li>
        <li>
          <strong>Email address</strong>
        </li>
        <li>
          <strong>Avatar</strong> (for example, provided via Google sign-in if
          you choose to authenticate with Google)
        </li>
      </ul>

      <h3>2.2 Project and workspace data</h3>
      <p>
        The Service is built to help you manage projects. As a result, we store
        the content you and your organization submit, including:
      </p>
      <ul>
        <li>
          <strong>Project data</strong> such as projects, boards, sprints, tasks,
          tickets, descriptions, comments, attachments, labels, and related
          collaboration content (collectively, &ldquo;Project Data&rdquo;).
        </li>
      </ul>

      <h3>2.3 Technical and usage information</h3>
      <p>
        We collect limited technical data for security, reliability, and
        analytics purposes, which may include IP address, device and browser
        information, timestamps, and event/usage data. We use{" "}
        <strong>Vercel Analytics</strong> to understand performance and usage
        patterns.
      </p>

      <h2>3. How we use information</h2>
      <ul>
        <li>
          <strong>Provide the Service</strong> (create accounts, authenticate
          users, store and display Project Data, and enable collaboration).
        </li>
        <li>
          <strong>Maintain and improve</strong> the Service (debugging,
          performance monitoring, product improvements).
        </li>
        <li>
          <strong>Security and abuse prevention</strong> (fraud detection,
          enforcing policies, protecting users and Sprintify).
        </li>
        <li>
          <strong>Communications</strong> (service updates, critical notices,
          support responses).
        </li>
        <li>
          <strong>Compliance</strong> with legal obligations and enforcement of
          our Terms.
        </li>
      </ul>

      <h2>4. Cookies and similar technologies</h2>
      <p>
        Sprintify uses cookies and similar technologies for essential service
        operation and for analytics.
      </p>

      <h3>4.1 Essential cookies (authentication)</h3>
      <p>
        We use essential cookies required for authentication and session
        management, including cookies set by Supabase Auth. These cookies are
        necessary to provide the Service and cannot be disabled if you want to
        use authenticated features.
      </p>

      <h3>4.2 Analytics cookies</h3>
      <p>
        We use Vercel Analytics to measure performance and usage. Vercel
        Analytics may set cookies or use similar technologies depending on your
        configuration and region. We use analytics data to improve reliability,
        identify errors, and understand feature adoption.
      </p>

      <h3>4.3 Consent</h3>
      <p>
        By using sprintify.org, you agree that essential cookies will be used.
        Where required by applicable law, Sprintify will obtain consent for
        non-essential cookies (such as analytics cookies).
      </p>

      <h2>5. Where and how your data is processed</h2>
      <p>
        Sprintify uses service providers to host and operate the Service:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> (PostgreSQL database and authentication).
        </li>
        <li>
          <strong>Vercel</strong> (application hosting and delivery).
        </li>
      </ul>
      <p>
        These providers act as processors (or sub-processors) for the purposes
        of providing the Service. We do not sell your personal information.
      </p>

      <h2>6. Data sharing</h2>
      <p>
        We share information only as necessary to operate the Service, comply
        with law, and protect Sprintify and our users. Examples include:
      </p>
      <ul>
        <li>
          <strong>Service providers</strong> (Supabase, Vercel, Vercel Analytics)
          to host, secure, and analyze the Service.
        </li>
        <li>
          <strong>Legal and safety</strong> where required by law or to protect
          rights, safety, and security.
        </li>
      </ul>

      <h2>7. Data retention</h2>
      <p>
        We retain personal information and Project Data for as long as your
        account is active or as needed to provide the Service. We may retain
        certain information for longer where required to comply with legal
        obligations, resolve disputes, enforce agreements, or for legitimate
        business purposes such as security.
      </p>

      <h2>8. Your rights and choices (GDPR/CCPA principles)</h2>
      <p>
        Depending on where you live, you may have rights to access, correct,
        delete, or export your data, and to object to or restrict certain
        processing. Sprintify supports these general principles and will respond
        to verified requests consistent with applicable law.
      </p>
      <p>
        <strong>Data deletion requests:</strong> You can request deletion of
        your account and associated data by contacting{" "}
        <a href="mailto:support@sprintify.org">support@sprintify.org</a>.
      </p>

      <h2>9. Security</h2>
      <p>
        We implement reasonable administrative, technical, and organizational
        measures designed to protect information. No method of transmission or
        storage is 100% secure, so we cannot guarantee absolute security.
      </p>

      <h2>10. International transfers</h2>
      <p>
        Your information may be processed in countries other than your own,
        depending on where our service providers operate. Where required, we
        rely on appropriate safeguards for such transfers.
      </p>

      <h2>11. Changes to this Privacy Policy</h2>
      <p>
        We may update this policy from time to time. We will post the updated
        version on this page and update the &ldquo;Last updated&rdquo; date. If
        changes are material, we may provide additional notice.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about this Privacy Policy can be sent to{" "}
        <a href="mailto:support@sprintify.org">support@sprintify.org</a>.
      </p>
    </>
  );
}
