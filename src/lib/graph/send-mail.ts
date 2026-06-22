import "server-only";
import { cookies } from "next/headers";

const GRAPH_SEND = "https://graph.microsoft.com/v1.0/me/sendMail";
const TOKEN_COOKIE = "__ms_at"; // access token (encrypted, httpOnly)
const REFRESH_COOKIE = "__ms_rt"; // refresh token (encrypted, httpOnly)
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Store Microsoft tokens in httpOnly cookies (called from auth callback) */
export async function storeMsTokens(accessToken: string, refreshToken: string | null) {
  const jar = await cookies();
  jar.set(TOKEN_COOKIE, accessToken, { ...COOKIE_OPTS, maxAge: 3600 });
  if (refreshToken) {
    jar.set(REFRESH_COOKIE, refreshToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 90 }); // 90d
  }
}

/** Refresh the access token using the stored refresh token */
async function refreshAccessToken(): Promise<string | null> {
  const jar = await cookies();
  const rt = jar.get(REFRESH_COOKIE)?.value;
  if (!rt) return null;

  const tenantId = process.env.AZURE_TENANT_ID ?? "common";
  const clientId = process.env.SUPABASE_AUTH_AZURE_CLIENT_ID ?? process.env.AZURE_CLIENT_ID ?? "";
  const clientSecret = process.env.SUPABASE_AUTH_AZURE_SECRET ?? process.env.AZURE_CLIENT_SECRET ?? "";

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: rt,
      scope: "openid profile email offline_access Mail.Send",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.access_token) return null;

  jar.set(TOKEN_COOKIE, data.access_token, { ...COOKIE_OPTS, maxAge: 3600 });
  if (data.refresh_token) {
    jar.set(REFRESH_COOKIE, data.refresh_token, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 90 });
  }
  return data.access_token;
}

/** Get a valid Microsoft access token (refresh if expired) */
async function getMsToken(): Promise<string | null> {
  const jar = await cookies();
  const at = jar.get(TOKEN_COOKIE)?.value;
  if (at) return at;
  return refreshAccessToken();
}

export type Recipient = { email: string; name?: string };

export type SendMailOptions = {
  to: Recipient[];
  subject: string;
  /** HTML body — can include basic formatting */
  htmlBody: string;
};

export type SendMailResult =
  | { ok: true }
  | { ok: false; error: string; needsLogin?: boolean };

/**
 * Send an email via Microsoft Graph API as the signed-in admin.
 * Returns { ok: true } on success or { ok: false, error, needsLogin? } on failure.
 */
export async function graphSendMail(opts: SendMailOptions): Promise<SendMailResult> {
  const token = await getMsToken();
  if (!token) {
    return { ok: false, error: "No Microsoft token found. Please sign out and sign in again with Microsoft.", needsLogin: true };
  }

  const payload = {
    message: {
      subject: opts.subject,
      body: { contentType: "HTML", content: opts.htmlBody },
      toRecipients: opts.to.map((r) => ({
        emailAddress: { address: r.email, name: r.name ?? r.email },
      })),
    },
    saveToSentItems: true,
  };

  const res = await fetch(GRAPH_SEND, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 202) return { ok: true };

  // Token may be expired (401) — try refresh once
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      return { ok: false, error: "Microsoft session expired. Please sign in again with Microsoft.", needsLogin: true };
    }
    const retry = await fetch(GRAPH_SEND, {
      method: "POST",
      headers: { Authorization: `Bearer ${newToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (retry.status === 202) return { ok: true };
    const errBody = await retry.text().catch(() => "");
    return { ok: false, error: `Graph API error ${retry.status}: ${errBody}` };
  }

  const errBody = await res.text().catch(() => "");
  return { ok: false, error: `Graph API error ${res.status}: ${errBody}` };
}
