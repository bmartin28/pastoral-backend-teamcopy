import { Client } from "@microsoft/microsoft-graph-client";
import { createGraphClient } from "./graph.js";
import { createDelegatedGraphClient } from "./graphDelegated.js";
import { z } from "zod";

const Message = z.object({
  id: z.string(),
  internetMessageId: z.string().optional(),
  conversationId: z.string().optional(),
  subject: z.string().nullable(),
  receivedDateTime: z.string(),
  from: z.object({ emailAddress: z.object({ name: z.string().optional(), address: z.string() }) }).nullable(),
  toRecipients: z.array(z.object({ emailAddress: z.object({ address: z.string() }) })).optional(),
  ccRecipients: z.array(z.object({ emailAddress: z.object({ address: z.string() }) })).optional(),
  bodyPreview: z.string().optional(),
  body: z.object({ contentType: z.string(), content: z.string() }).optional(),
});

export type Message = z.infer<typeof Message>;

export async function fetchRecentMail(
  mailbox: string,
  tenantId: string,
  clientId: string,
  clientSecret: string | null,
  max = 50,
  useDelegated: boolean = false
): Promise<Message[]> {
  let client: Client;
  
  if (useDelegated || !clientSecret) {
    // Use delegated permissions (user sign-in)
    client = await createDelegatedGraphClient(tenantId, clientId, mailbox);
  } else {
    // Use application permissions (client secret)
    client = createGraphClient(tenantId, clientId, clientSecret);
  }
  
  // Fetch messages from last 24 hours
  const sinceDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  
  try {
    const res = await client
      .api(`/users/${encodeURIComponent(mailbox)}/mailFolders/Inbox/messages`)
      .filter(`receivedDateTime ge ${sinceDate}`)
      .top(max)
      .select("id,internetMessageId,conversationId,subject,receivedDateTime,from,toRecipients,ccRecipients,bodyPreview,body")
      .orderby("receivedDateTime DESC")
      .get();

    const items = Array.isArray(res.value) ? res.value : [];
    return items.map((m: any) => Message.parse(m));
  } catch (error: any) {
    console.error('Graph API Error Details:', {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    });
    
    // Try to read the error body if it's a stream
    if (error.body) {
      try {
        if (typeof error.body.getReader === 'function') {
          const reader = error.body.getReader();
          const { value } = await reader.read();
          if (value) {
            const errorText = new TextDecoder().decode(value);
            console.error('Graph API Error Body:', errorText);
          }
        } else if (typeof error.body.text === 'function') {
          const errorText = await error.body.text();
          console.error('Graph API Error Body:', errorText);
        }
      } catch (e) {
        console.error('Could not read error body:', e);
      }
    }
    
    // Log more details if available
    if (error.statusCode === 401) {
      console.error('401 Unauthorized - Check:');
      console.error('1. Are you using the correct authentication method?');
      console.error('2. For personal emails: Set USE_DELEGATED_PERMISSIONS=true and TENANT_ID=common');
      console.error('3. For org emails: Ensure CLIENT_SECRET is correct and admin consent is granted');
      console.error('4. Check that the mailbox address is correct:', mailbox);
    }
    
    throw error;
  }
}

// Filter to specific senders/people
const allowedSenders = new Set<string>();

export function setAllowedSenders(senders: string[]) {
  allowedSenders.clear();
  senders.forEach(s => allowedSenders.add(s.toLowerCase()));
}

export function isFromInterestingPerson(msg: Message): boolean {
  const from = msg.from?.emailAddress.address?.toLowerCase();
  return !!from && (allowedSenders.size === 0 || allowedSenders.has(from));
}

