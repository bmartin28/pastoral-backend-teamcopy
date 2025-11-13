export type TriageResult = {
  isSupportCase: boolean;
  confidence: number; // 0-1
  studentEmail?: string;
  names?: string[];
  programme?: string;
  tags?: string[];
  suggestedCaseAction?: "Open" | "Note" | "Ignore";
  rationale?: string;
};

export interface TriageModel {
  classify(input: { subject: string; bodyText: string; from?: string }): Promise<TriageResult>;
}

