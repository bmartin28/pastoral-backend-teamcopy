import { fetchRecentMail, isFromInterestingPerson, setAllowedSenders } from "./scraper.js";
import type { TriageModel } from "./ai.js";
import { getTriageModel } from "./db.js";
import type { TriageItem } from "./db.js";
import { heuristicFallback } from "./heuristics.js";
import type { Message } from "./scraper.js";

let triageModel: TriageModel | null = null;

export function setTriageModel(model: TriageModel) {
  triageModel = model;
}

export function setAllowedSendersList(senders: string[]) {
  setAllowedSenders(senders);
}

export async function runTriageCycle() {
  if (!triageModel) {
    throw new Error("Triage model not initialized");
  }

  const mailbox = process.env.MONITORED_MAILBOX;
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || null;
  const useDelegated = process.env.USE_DELEGATED_PERMISSIONS === 'true' || !clientSecret;

  if (!mailbox || !tenantId || !clientId) {
    throw new Error("Missing required environment variables for email fetching (MONITORED_MAILBOX, TENANT_ID, CLIENT_ID)");
  }

  if (!useDelegated && !clientSecret) {
    throw new Error("CLIENT_SECRET is required when using Application permissions. Set USE_DELEGATED_PERMISSIONS=true for personal emails.");
  }

  // Set allowed senders from environment if provided
  const allowedSendersEnv = process.env.ALLOWED_SENDERS;
  if (allowedSendersEnv) {
    setAllowedSenders(allowedSendersEnv.split(',').map(s => s.trim()));
  }

  const TriageItemModel = getTriageModel();

  try {
    const messages = await fetchRecentMail(mailbox, tenantId, clientId, clientSecret, 100, useDelegated);
    let processed = 0;
    let skipped = 0;

    // Known non-support email patterns (system notifications, etc.)
    const nonSupportPatterns = [
      /account-security-noreply@accountprotection\.microsoft\.com/i,
      /azure-noreply@microsoft\.com/i,
      /noreply@microsoft\.com/i,
      /no-reply@/i,
      /donotreply@/i,
      /automated@/i,
      /notification@/i,
    ];

    for (const m of messages) {
      if (!isFromInterestingPerson(m)) {
        skipped++;
        continue;
      }

      // Skip known system/automated emails
      const fromEmailLower = m.from?.emailAddress.address?.toLowerCase() || '';
      const isSystemEmail = nonSupportPatterns.some(pattern => pattern.test(fromEmailLower));
      if (isSystemEmail) {
        skipped++;
        continue;
      }

      // Skip emails with system notification subjects
      const subject = (m.subject ?? '').toLowerCase();
      const isSystemSubject = /^(new sign-in|password reset|account verification|welcome to|security alert|account security)/i.test(subject);
      if (isSystemSubject && isSystemEmail) {
        skipped++;
        continue;
      }

      // De-dupe by Graph id
      const exists = await TriageItemModel.findOne({ graphMessageId: m.id }).exec();
      if (exists) {
        skipped++;
        continue;
      }

      // Prefer text: if body is HTML, strip tags
      const bodyText = m.body?.contentType === "html"
        ? m.body.content.replace(/<[^>]+>/g, " ")
        : (m.body?.content ?? m.bodyPreview ?? "");

      const fromEmail = m.from?.emailAddress.address;
      let res = await triageModel.classify({
        subject: m.subject ?? "",
        bodyText,
        ...(fromEmail ? { from: fromEmail } : {}),
      });

      // Apply fallback if low confidence
      if (res.confidence < 0.5) {
        const fb = heuristicFallback(m);
        if (fb.confidence > res.confidence) {
          res = fb;
        }
      }

      const triageItem = new TriageItemModel({
        graphMessageId: m.id,
        threadId: m.conversationId ?? null,
        mailbox,
        receivedAt: new Date(m.receivedDateTime),
        subject: m.subject ?? "",
        from: m.from?.emailAddress.address ?? "",
        to: (m.toRecipients ?? []).map(r => r.emailAddress.address),
        cc: (m.ccRecipients ?? []).map(r => r.emailAddress.address),
        bodyPreview: m.bodyPreview ?? "",
        extracted: {
          studentEmail: res.studentEmail,
          names: res.names,
          programme: res.programme,
          tags: res.tags,
          suggestedCaseAction: res.suggestedCaseAction,
        },
        confidence: res.confidence,
        status: "New",
      });

      await triageItem.save();
      processed++;
    }

    console.log(`Triage cycle complete: ${processed} processed, ${skipped} skipped`);
    return { processed, skipped };
  } catch (error) {
    console.error("Error in triage cycle:", error);
    throw error;
  }
}

