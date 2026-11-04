import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export interface AnalyzedIssue {
  title: string;
  category: 'Tone' | 'Terminology' | 'Messaging' | 'Facts' | 'Claims' | 'Visual identity' | 'Accessibility';
  severity: 'High' | 'Medium' | 'Low';
  problematic_text: string;
  explanation: string;
  source_guideline_id?: string;
  suggested_correction: string;
  confidence: 'High' | 'Medium' | 'Unverified';
}

export interface AnalysisResult {
  compliance_score: number;
  overall_summary: string;
  issues: AnalyzedIssue[];
  used_ai: boolean;
}

export async function analyzeWithGemini(
  content: string,
  contentType: string,
  guidelines: Array<{ id: string; title: string; category: string; description: string; severity: string; prohibited_phrase?: string; preferred_replacement?: string }>,
  approvedFacts: Array<{ id: string; fact: string; source: string }>,
  terminology: Array<{ id: string; prohibited_term: string; preferred_term: string; explanation: string }>
): Promise<AnalysisResult | null> {
  if (!ai || !process.env.GEMINI_API_KEY) {
    return null;
  }

  const prompt = `
You are the Brand Compliance Officer and Governance Engine for "BrandGuard AI".
Analyze the submitted marketing/corporate content strictly against the provided approved brand guidelines, verified facts, and terminology rules.

SUBMITTED CONTENT (${contentType}):
"""
${content}
"""

APPROVED BRAND GUIDELINES:
${JSON.stringify(guidelines, null, 2)}

APPROVED VERIFIED CORPORATE FACTS:
${JSON.stringify(approvedFacts, null, 2)}

APPROVED TERMINOLOGY & GLOSSARY:
${JSON.stringify(terminology, null, 2)}

CRITICAL GOVERNANCE RULES:
1. NEVER invent approved facts or citations.
2. If a quantitative metric, statistic, or fact (e.g. "50,000 customers", "100 countries") cannot be verified using the approved facts knowledge base above, label it as "Unverified" (confidence: "Unverified"), NOT as false.
3. Check for tone issues (aggressive urgency like "Buy now or miss out!", pushy sales tactics, hypes).
4. Check for prohibited terminology (e.g., using "users" instead of "customers").
5. Check for unsupported promotional claims (e.g. "guarantees results", "best ever").
6. Provide exact substring in "problematic_text".
7. Provide a realistic suggested correction that preserves the author's intent while respecting brand standards.
8. Calculate a compliance score between 0 and 100 based on severity and issue count.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an enterprise brand compliance auditing engine. Return structured JSON compliance reports with high precision.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            compliance_score: {
              type: Type.INTEGER,
              description: 'Score from 0 to 100 based on detected violations',
            },
            overall_summary: {
              type: Type.STRING,
              description: 'Executive summary of brand compliance findings',
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    description: 'One of: Tone, Terminology, Messaging, Facts, Claims, Visual identity, Accessibility',
                  },
                  severity: {
                    type: Type.STRING,
                    description: 'High, Medium, or Low',
                  },
                  problematic_text: {
                    type: Type.STRING,
                    description: 'Exact excerpt from submitted content',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Why this violates brand policy',
                  },
                  source_guideline_id: {
                    type: Type.STRING,
                    description: 'ID of violated guideline or fact if matched',
                  },
                  suggested_correction: {
                    type: Type.STRING,
                    description: 'Brand-safe alternative phrasing',
                  },
                  confidence: {
                    type: Type.STRING,
                    description: 'High, Medium, or Unverified',
                  },
                },
                required: ['title', 'category', 'severity', 'problematic_text', 'explanation', 'suggested_correction', 'confidence'],
              },
            },
          },
          required: ['compliance_score', 'overall_summary', 'issues'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed && Array.isArray(parsed.issues)) {
      return {
        compliance_score: Math.max(0, Math.min(100, parsed.compliance_score ?? 70)),
        overall_summary: parsed.overall_summary || 'Compliance check completed.',
        issues: parsed.issues,
        used_ai: true,
      };
    }
    return null;
  } catch (error) {
    console.error('Gemini API analysis failed, falling back to rule engine:', error);
    return null;
  }
}
