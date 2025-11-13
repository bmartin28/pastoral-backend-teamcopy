import { OpenAIClient } from "@azure/openai";
import { AzureKeyCredential } from "@azure/core-auth";
import { TriageModel, TriageResult } from "./ai.js";

export class AzureOpenAITriage implements TriageModel {
  private client: OpenAIClient;
  private deploymentName: string;

  constructor(
    endpoint: string,
    apiKey: string,
    deploymentName: string = "gpt-4o-mini"
  ) {
    this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    this.deploymentName = deploymentName;
  }

  async classify(input: { subject: string; bodyText: string; from?: string }): Promise<TriageResult> {
    const prompt = `You are a classifier for a university student support desk (pastoral care system).
Your job is to identify emails that relate to genuine student support cases requiring pastoral care intervention.

**What IS a student support case:**
- Student requests for help, support, or advice
- Mental health concerns, wellbeing issues, anxiety, depression, stress
- Accommodation problems, housing issues
- Financial hardship, emergency financial support
- Disability support requests
- Extenuating circumstances, mitigating circumstances
- Academic concerns that affect wellbeing
- Personal crises, family issues affecting studies
- Student complaints or grievances
- Requests for counselling or mental health support

**What is NOT a student support case:**
- Automated system notifications (security alerts, password resets, account verifications)
- Marketing emails, newsletters, promotional content
- System-generated emails from Microsoft, Azure, or other services
- Email delivery notifications, read receipts
- Calendar invitations or meeting requests (unless they contain support requests)
- General university announcements (unless they mention support services)

**Classification Guidelines:**
- If the email is from a student asking for help, support, or reporting issues → isSupportCase: true, confidence: 0.7-1.0
- If the email mentions support keywords but is automated/system → isSupportCase: false, confidence: 0.1-0.3
- If unclear or borderline → isSupportCase: false, confidence: 0.3-0.5

**Extract information:**
- studentEmail: The student's email address if mentioned (look for @university.ac.uk or similar)
- names: Any student names mentioned
- programme: Course/programme name if mentioned
- tags: Relevant tags like ["mental-health", "accommodation", "financial", "academic", "emergency", etc.]
- suggestedCaseAction: 
  - "Open" for urgent cases requiring immediate attention
  - "Note" for informational cases that should be recorded
  - "Ignore" for non-support cases or spam

Return strict JSON with fields:
{ "isSupportCase": boolean, "confidence": 0..1, "studentEmail": string|null, "names": string[], "programme": string|null, "tags": string[], "suggestedCaseAction": "Open"|"Note"|"Ignore", "rationale": string }.

Subject: ${input.subject ?? ""}
From: ${input.from ?? ""}
Body:
${input.bodyText?.slice(0, 4000)}`;

    try {
      const resp = await this.client.getChatCompletions(this.deploymentName, [
        { role: "user", content: prompt }
      ], {
        temperature: 0.2,
        responseFormat: { type: "json_object" }
      });

      const content = resp.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Azure OpenAI");
      }

      const json = JSON.parse(content);
      return {
        isSupportCase: !!json.isSupportCase,
        confidence: Number(json.confidence ?? 0),
        studentEmail: json.studentEmail ?? undefined,
        names: Array.isArray(json.names) ? json.names : [],
        programme: json.programme ?? undefined,
        tags: Array.isArray(json.tags) ? json.tags : [],
        suggestedCaseAction: json.suggestedCaseAction ?? "Ignore",
        rationale: json.rationale,
      };
    } catch (error) {
      console.error("Azure OpenAI classification error:", error);
      // Return fallback result
      return {
        isSupportCase: false,
        confidence: 0.1,
        suggestedCaseAction: "Ignore",
        tags: ["error"],
        rationale: "Classification failed due to error"
      };
    }
  }
}

