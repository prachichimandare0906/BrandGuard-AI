import { AnalyzedIssue, AnalysisResult } from './gemini';

export function analyzeWithRuleEngine(
  content: string,
  _contentType: string,
  guidelines: Array<{ id: string; title: string; category: string; description: string; severity: string; prohibited_phrase?: string; preferred_replacement?: string }>,
  approvedFacts: Array<{ id: string; fact: string; source: string }>,
  terminology: Array<{ id: string; prohibited_term: string; preferred_term: string; explanation: string }>
): AnalysisResult {
  const issues: AnalyzedIssue[] = [];
  const lowerContent = content.toLowerCase();

  // 1. Check prohibited terminology
  for (const term of terminology) {
    const prohibited = term.prohibited_term.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegExp(prohibited)}\\b`, 'gi');
    let match;
    while ((match = regex.exec(content)) !== null) {
      issues.push({
        title: `Prohibited Terminology: "${match[0]}"`,
        category: 'Terminology',
        severity: 'Medium',
        problematic_text: match[0],
        explanation: term.explanation || `The term "${match[0]}" is prohibited in external communications. Use "${term.preferred_term}" instead.`,
        source_guideline_id: 'RULE-TERM-01',
        suggested_correction: term.preferred_term,
        confidence: 'High',
      });
    }
  }

  // 2. Check explicit guideline prohibited phrases
  for (const rule of guidelines) {
    if (rule.prohibited_phrase) {
      const phrase = rule.prohibited_phrase.toLowerCase();
      const regex = new RegExp(escapeRegExp(phrase), 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        // avoid duplicate if already captured
        const exists = issues.some(
          (i) => i.problematic_text.toLowerCase() === match![0].toLowerCase() && i.category === rule.category
        );
        if (!exists) {
          issues.push({
            title: `Guideline Violation: ${rule.title}`,
            category: rule.category as any,
            severity: rule.severity as any,
            problematic_text: match[0],
            explanation: rule.description,
            source_guideline_id: rule.id,
            suggested_correction: rule.preferred_replacement || 'Please revise according to brand standards.',
            confidence: 'High',
          });
        }
      }
    }
  }

  // 3. Superlative & Claim detection (e.g. "best ever", "guarantees", "#1")
  const superlativeMatches = [
    {
      regex: /\b(best ever|#1|number one|unbeatable|world's best|100% guaranteed)\b/gi,
      title: 'Unsubstantiated Superlative Claim',
      category: 'Claims' as const,
      severity: 'High' as const,
      explanation: 'Superlatives and unconditional superiority statements require verifiable third-party analyst benchmark citations.',
      suggested_correction: 'industry-leading',
      ruleId: 'RULE-CLAIM-02',
    },
    {
      regex: /\b(guarantees? results?|guaranteed outcome|guaranteed return)\b/gi,
      title: 'Unsupported Performance Guarantee',
      category: 'Claims' as const,
      severity: 'High' as const,
      explanation: 'Performance guarantees violate legal compliance guidelines without certified trial documentation.',
      suggested_correction: 'is engineered to deliver measurable outcomes',
      ruleId: 'RULE-CLAIM-01',
    },
    {
      regex: /\b(buy now or miss out!?|act fast or regret|don't miss out!?|last chance!?)\b/gi,
      title: 'Aggressive Urgency & Artificial Scarcity',
      category: 'Tone' as const,
      severity: 'Medium' as const,
      explanation: 'Violates Nova Tech brand voice. Enterprise tone must be informative and respectful, avoiding high-pressure consumer sales tactics.',
      suggested_correction: 'Explore how Nova Tech can support your team today.',
      ruleId: 'RULE-TONE-01',
    },
  ];

  for (const sup of superlativeMatches) {
    let match;
    while ((match = sup.regex.exec(content)) !== null) {
      const alreadyReported = issues.some(
        (i) => i.problematic_text.toLowerCase() === match![0].toLowerCase()
      );
      if (!alreadyReported) {
        issues.push({
          title: sup.title,
          category: sup.category,
          severity: sup.severity,
          problematic_text: match[0],
          explanation: sup.explanation,
          source_guideline_id: sup.ruleId,
          suggested_correction: sup.suggested_correction,
          confidence: 'High',
        });
      }
    }
  }

  // 4. Quantitative metrics / Facts verification
  // Detect statistics like "50,000 customers", "10,000 users", "99%", etc.
  const statRegex = /\b(\d+[\d,]*\+?|\d+k|\d+m)\s+(customers|clients|users|organizations|downloads|teams)\b/gi;
  let statMatch;
  while ((statMatch = statRegex.exec(content)) !== null) {
    const fullStat = statMatch[0];
    // Check if this fact is in approved facts
    const verified = approvedFacts.some((af) =>
      af.fact.toLowerCase().includes(fullStat.toLowerCase())
    );

    if (!verified) {
      issues.push({
        title: `Unverified Statistical Claim: "${fullStat}"`,
        category: 'Facts',
        severity: 'Medium',
        problematic_text: fullStat,
        explanation: `The claim "${fullStat}" cannot be verified against current corporate fact sheets. Labelled as unverified. Evidence or legal sign-off required prior to public release.`,
        source_guideline_id: 'RULE-FACT-01',
        suggested_correction: 'numerous enterprise client partners',
        confidence: 'Unverified',
      });
    }
  }

  // Deduct score based on issues
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'High') score -= 22;
    else if (issue.severity === 'Medium') score -= 14;
    else score -= 8;
  }
  score = Math.max(10, Math.min(100, score));

  return {
    compliance_score: score,
    overall_summary:
      issues.length === 0
        ? 'Content meets all approved brand governance criteria, tone rules, and verified facts.'
        : `Identified ${issues.length} potential compliance issue(s) requiring creator revision or managerial approval.`,
    issues,
    used_ai: false,
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
