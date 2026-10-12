import { ReplitConnectors } from "@replit/connectors-sdk";

type GraphErrorResponse = {
  error?: {
    message?: string;
    code?: number;
    error_subcode?: number;
  };
};

type GraphMessageResponse = {
  messages?: Array<{ id: string }>;
};

export class WhatsAppProviderError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly graphCode?: number,
  ) {
    super(message);
    this.name = "WhatsAppProviderError";
  }
}

export function normalizeWhatsAppNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeE164(value: string): string {
  const digits = normalizeWhatsAppNumber(value);
  return digits ? `+${digits}` : "";
}

async function graphRequest<T>(
  path: string,
  options: { method: "GET" | "POST"; body?: Record<string, unknown> },
): Promise<T> {
  const serializedBody = options.body ? JSON.stringify(options.body) : undefined;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  let response: Response;

  if (accessToken) {
    response = await fetch(`https://graph.facebook.com${path}`, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(serializedBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(serializedBody ? { body: serializedBody } : {}),
    });
  } else {
    if (
      !process.env.REPLIT_CONNECTORS_HOSTNAME ||
      !process.env.REPL_IDENTITY
    ) {
      throw new Error(
        "WhatsApp is not configured for this server. Connect WhatsApp Business in Replit or set WHATSAPP_ACCESS_TOKEN on the self-hosted server.",
      );
    }

    const connectors = new ReplitConnectors();
    response = await connectors.proxy("whatsapp-business", path, {
      method: options.method,
      headers: serializedBody ? { "Content-Type": "application/json" } : {},
      body: serializedBody,
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const error = payload as GraphErrorResponse;
    throw new WhatsAppProviderError(
      error.error?.message ?? `WhatsApp API returned HTTP ${response.status}.`,
      response.status,
      error.error?.code,
    );
  }

  return payload as T;
}

export async function sendWhatsAppTextMessage(args: {
  businessPhoneNumberId: string;
  to: string;
  text: string;
}): Promise<string> {
  const version = process.env.WHATSAPP_GRAPH_API_VERSION ?? "v23.0";
  const result = await graphRequest<GraphMessageResponse>(
    `/${version}/${encodeURIComponent(args.businessPhoneNumberId)}/messages`,
    {
      method: "POST",
      body: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizeWhatsAppNumber(args.to),
        type: "text",
        text: { body: args.text, preview_url: false },
      },
    },
  );

  const messageId = result.messages?.[0]?.id;
  if (!messageId) {
    throw new Error("WhatsApp accepted the request without returning a message ID.");
  }
  return messageId;
}

export async function sendWhatsAppTemplateMessage(args: {
  businessPhoneNumberId: string;
  to: string;
  templateName: string;
  languageCode?: string;
  parameters: string[];
}): Promise<string> {
  const version = process.env.WHATSAPP_GRAPH_API_VERSION ?? "v23.0";
  const result = await graphRequest<GraphMessageResponse>(
    `/${version}/${encodeURIComponent(args.businessPhoneNumberId)}/messages`,
    {
      method: "POST",
      body: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizeWhatsAppNumber(args.to),
        type: "template",
        template: {
          name: args.templateName,
          language: { code: args.languageCode ?? process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US" },
          components: [
            {
              type: "body",
              parameters: args.parameters.map((text) => ({ type: "text", text })),
            },
          ],
        },
      },
    },
  );

  const messageId = result.messages?.[0]?.id;
  if (!messageId) {
    throw new Error("WhatsApp accepted the template request without returning a message ID.");
  }
  return messageId;
}
