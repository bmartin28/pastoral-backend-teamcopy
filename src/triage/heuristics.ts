import { Message } from "./scraper.js";
import { TriageResult } from "./ai.js";

export function heuristicFallback(msg: Message): TriageResult {
  const txt = `${msg.subject ?? ""} ${msg.bodyPreview ?? ""}`.toLowerCase();
  const fromEmail = msg.from?.emailAddress.address?.toLowerCase() || '';
  
  // Skip system emails
  if (/noreply|no-reply|donotreply|automated|notification|account-security|azure-noreply/i.test(fromEmail)) {
    return {
      isSupportCase: false,
      confidence: 0.1,
      tags: ["system-email"],
      suggestedCaseAction: "Ignore",
      rationale: "Automated system email"
    };
  }

  // Support keywords
  const supportKeywords = /(accommodation|mitigating|extenuating|support|wellbeing|counselling|disability|mental health|anxiety|depression|stress|welfare|financial hardship|emergency|urgent help|help me|i need help|struggling|difficulty|problem|issue|concern|worried|anxious)/i;
  const hit = supportKeywords.test(txt);
  
  // Extract student email if present
  const emailMatch = txt.match(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i);
  const studentEmail = emailMatch ? emailMatch[0] : undefined;
  
  // Extract tags based on content
  const tags: string[] = [];
  if (/accommodation|housing|residence/i.test(txt)) tags.push("accommodation");
  if (/mental health|anxiety|depression|stress|wellbeing|counselling/i.test(txt)) tags.push("mental-health");
  if (/financial|hardship|money|funding/i.test(txt)) tags.push("financial");
  if (/mitigating|extenuating|circumstances/i.test(txt)) tags.push("academic");
  if (/emergency|urgent/i.test(txt)) tags.push("emergency");
  
  return {
    isSupportCase: hit,
    confidence: hit ? 0.6 : 0.25,
    studentEmail,
    tags: tags.length > 0 ? tags : (hit ? ["keyword"] : []),
    suggestedCaseAction: hit ? (tags.includes("emergency") ? "Open" : "Note") : "Ignore",
    rationale: hit ? "Contains support-related keywords" : "No support indicators found"
  };
}

