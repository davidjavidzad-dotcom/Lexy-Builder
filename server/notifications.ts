import type { Intake, Lawyer } from "@shared/schema";

type EmailPayload = {
  to: string[];
  from: string;
  subject: string;
  html: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (Array.isArray(value)) return value.map(stringifyValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function findValue(data: Record<string, unknown>, names: string[]) {
  const normalized = Object.entries(data || {}).map(([key, value]) => ({
    key: key.toLowerCase().replace(/[^a-z0-9]/g, ""),
    value,
  }));

  for (const name of names) {
    const match = normalized.find((entry) => entry.key.includes(name));
    if (match?.value !== undefined && match.value !== null && String(match.value).trim() !== "") {
      return stringifyValue(match.value);
    }
  }

  return "";
}

function getContactDetails(intake: Intake) {
  const data = (intake.data && typeof intake.data === "object" && !Array.isArray(intake.data))
    ? intake.data as Record<string, unknown>
    : {};
  const firstName = findValue(data, ["firstname", "clientfirstname"]);
  const lastName = findValue(data, ["lastname", "clientlastname"]);
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    name: combinedName || findValue(data, ["fullname", "clientname", "name"]) || "Unknown lead",
    email: findValue(data, ["email", "mail"]),
    phone: findValue(data, ["phone", "mobile", "tel"]),
    location: findValue(data, ["state", "jurisdiction", "county", "city"]),
  };
}

function buildAnswerRows(intake: Intake) {
  const data = (intake.data && typeof intake.data === "object" && !Array.isArray(intake.data))
    ? intake.data as Record<string, unknown>
    : {};

  return Object.entries(data)
    .filter(([key]) => key !== "goodlegal_submission_consent")
    .slice(0, 18)
    .map(([key, value]) => `
      <tr>
        <th style="border:1px solid #dde5dd;padding:8px;text-align:left;background:#f6f8f4;">${escapeHtml(key.replaceAll("_", " "))}</th>
        <td style="border:1px solid #dde5dd;padding:8px;white-space:pre-wrap;">${escapeHtml(stringifyValue(value))}</td>
      </tr>
    `)
    .join("");
}

function buildIntakeHtml(intake: Intake, extraMessage?: string) {
  const contact = getContactDetails(intake);
  const adminUrl = process.env.PUBLIC_APP_URL ? `${process.env.PUBLIC_APP_URL.replace(/\/$/, "")}/admin` : "https://goodlegal.tech/admin";

  return `
    <div style="font-family:Arial,sans-serif;color:#172017;line-height:1.45;">
      <h1 style="font-size:22px;margin:0 0 12px;">New Lexy intake</h1>
      <p style="margin:0 0 16px;">${escapeHtml(extraMessage || "A user submitted a Lexy intake for GoodLegal review.")}</p>
      <table style="border-collapse:collapse;width:100%;margin-bottom:18px;">
        <tr><th style="text-align:left;padding:6px 0;width:140px;">Intake</th><td>${escapeHtml(intake.id)}</td></tr>
        <tr><th style="text-align:left;padding:6px 0;">Workflow</th><td>${escapeHtml(intake.workflowTitle)}</td></tr>
        <tr><th style="text-align:left;padding:6px 0;">Lead</th><td>${escapeHtml(contact.name)}</td></tr>
        <tr><th style="text-align:left;padding:6px 0;">Email</th><td>${escapeHtml(contact.email || "Not provided")}</td></tr>
        <tr><th style="text-align:left;padding:6px 0;">Phone</th><td>${escapeHtml(contact.phone || "Not provided")}</td></tr>
        <tr><th style="text-align:left;padding:6px 0;">Location</th><td>${escapeHtml(contact.location || "Not provided")}</td></tr>
      </table>
      <p style="margin:0 0 12px;"><a href="${escapeHtml(adminUrl)}">Open GoodLegal Admin</a></p>
      <h2 style="font-size:16px;margin:20px 0 8px;">Answers</h2>
      <table style="border-collapse:collapse;width:100%;font-size:13px;">${buildAnswerRows(intake)}</table>
    </div>
  `;
}

async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("Email notification skipped: RESEND_API_KEY is not configured.");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email notification failed: ${response.status} ${body}`);
  }
}

export async function notifyIntakeSubmitted(intake: Intake) {
  const to = (process.env.INTAKE_ALERT_TO || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const from = process.env.INTAKE_ALERT_FROM || "GoodLegal <onboarding@resend.dev>";

  if (to.length === 0) {
    console.info("Email notification skipped: INTAKE_ALERT_TO is not configured.");
    return;
  }

  await sendEmail({
    to,
    from,
    subject: `New Lexy intake: ${intake.workflowTitle}`,
    html: buildIntakeHtml(intake),
  });
}

export async function notifyConsultRequested(intake: Intake, lawyer: Lawyer) {
  const to = (process.env.INTAKE_ALERT_TO || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const from = process.env.INTAKE_ALERT_FROM || "GoodLegal <onboarding@resend.dev>";

  if (to.length === 0) {
    console.info("Consult notification skipped: INTAKE_ALERT_TO is not configured.");
    return;
  }

  await sendEmail({
    to,
    from,
    subject: `Consult requested: ${lawyer.name}`,
    html: buildIntakeHtml(intake, `The user requested a consult with ${lawyer.name} at ${lawyer.firm}.`),
  });
}
