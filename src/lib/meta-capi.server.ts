import { getRequest } from "@tanstack/react-start/server";

const META_PIXEL_ID = "1075822341637086";
const META_API_VERSION = "v18.0";

export interface MetaConversionInput {
  eventName: string;
  eventTime?: number;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  contentType?: string;
  eventSourceUrl?: string;
  eventId?: string;
}

export interface MetaConversionResponse {
  events_received?: number;
  fbtrace_id?: string;
  messages?: string[];
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
}

function parseCookieValue(cookies: string | null, name: string): string | undefined {
  if (!cookies) return undefined;
  const match = cookies.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match?.[1];
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return (forwarded.split(",")[0] ?? "").trim();
  }
  return req.headers.get("x-real-ip") ?? "";
}

export async function sendMetaConversionEvent(
  input: MetaConversionInput,
): Promise<MetaConversionResponse> {
  const token = process.env["META_CONVERSION_API_TOKEN"];
  if (!token) {
    throw new Error("META_CONVERSION_API_TOKEN is not configured");
  }

  const req = getRequest();
  if (!req) {
    throw new Error("Unable to read request context");
  }

  const userAgent = req.headers.get("user-agent") ?? "";
  const clientIp = getClientIp(req);
  const cookies = req.headers.get("cookie");
  const fbp = parseCookieValue(cookies, "_fbp");
  const fbc = parseCookieValue(cookies, "_fbc");

  const eventTime = input.eventTime ?? Math.floor(Date.now() / 1000);

  const customData: Record<string, unknown> = {};
  if (input.value !== undefined) customData["value"] = input.value;
  if (input.currency) customData["currency"] = input.currency;
  if (input.contentIds) customData["content_ids"] = input.contentIds;
  if (input.contentName) customData["content_name"] = input.contentName;
  if (input.contentType) customData["content_type"] = input.contentType;

  const userData: Record<string, unknown> = {
    client_ip_address: clientIp,
    client_user_agent: userAgent,
  };
  if (fbp) userData["fbp"] = fbp;
  if (fbc) userData["fbc"] = fbc;

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: eventTime,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        event_id: input.eventId,
        user_data: userData,
        custom_data: Object.keys(customData).length > 0 ? customData : undefined,
      },
    ],
  };

  const url = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let result: MetaConversionResponse;
  try {
    result = JSON.parse(text) as MetaConversionResponse;
  } catch {
    result = { messages: [text] };
  }

  if (!response.ok) {
    throw new Error(
      `Meta Conversions API returned ${response.status}: ${text}`,
    );
  }

  return result;
}
