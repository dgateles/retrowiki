import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

/**
 * Sends a transactional e-mail via Resend. In dev (no RESEND_API_KEY) it logs
 * to the console instead of sending, so the auth flows are testable offline.
 * Never throws into the request path — callers should not block on delivery.
 */
export async function sendEmail({ to, subject, html, text, headers }: SendArgs) {
  if (!resend) {
    console.log(
      `\n[email:dev] → ${to}\n  subject: ${subject}\n  ${text.replace(/\n/g, "\n  ")}\n`,
    );
    return { id: "dev-logged" };
  }
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
    headers,
  });
  if (error) {
    console.error("[email] send failed:", error.name);
    throw new Error("EMAIL_SEND_FAILED");
  }
  return data;
}
