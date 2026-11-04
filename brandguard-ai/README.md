
# BrandGuard AI
### Enterprise Brand Governance Platform

**Target Organization:** NOVA TECH  
**Team Name:** THE EXCEPTION  
**Participant:** Prachi Chimandare  
**Event:** CodeNexus

---

## 1. Product Overview

BrandGuard AI is an enterprise brand governance platform designed to protect organizations from unapproved facts, inconsistent brand tone, prohibited terminology, and unsupported promotional claims before publication.

In modern distributed marketing teams, content is created by employees, agencies, and generative AI tools. BrandGuard AI helps maintain brand safety by comparing draft content against verified corporate facts, registered brand guidelines, and approved terminology.

Its core philosophy is:

**"AI assists humans, not replaces them."**

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4
- **Icons:** Lucide React
- **Analytics:** Recharts
- **Backend:** Node.js and Express with REST APIs
- **Database:** SQLite (`better-sqlite3`) with WAL mode
- **AI Engine:** Google Gemini API through `@google/genai`
- **Fallback Engine:** Deterministic rule-based compliance checking
- **Document Processing:** PDF parsing, DOCX extraction using Mammoth, and TXT processing

---

## 3. Application Architecture and Navigation

The platform provides seven major modules:

1. **Overview:** Executive KPIs, governance lifecycle, quick demo testing, and recent submissions.
2. **Brand Knowledge Hub:** Centralized brand voice guidelines, approved facts, terminology, visual assets, and document uploads.
3. **Content Review:** Content submission, document ingestion, compliance analysis, issue detection, inline editing, and approval submission.
4. **Compliance Reports:** Compliance score, severity breakdown, original versus revised content, and PDF export.
5. **Approval Centre:** Human review queue with Approve, Reject, and Request Revision actions.
6. **Governance Analytics:** Submission statistics, violations by category, repeated prohibited terms, and unclear guideline warnings.
7. **Settings and RBAC:** Creator, Brand Manager, and Administrator personas, Responsible AI disclosures, and demo data reset.

---

## 4. Benchmark Test Scenario – NOVA TECH

Judges can test the platform using the preloaded NOVA TECH example:

> "We are the best ever! Our product guarantees results. Trusted by 50,000 customers. Buy now or miss out!"

### Expected Governance Issues

1. **"best ever!"** – Flagged as an unsubstantiated superlative claim. Suggested correction: "industry-leading".
2. **"guarantees results"** – Flagged as a high-severity unsupported performance guarantee. Suggested correction: "is designed to deliver measurable results".
3. **"50,000 customers"** – Flagged as unverified because it is absent from the approved facts ledger. Unverified does not necessarily mean false.
4. **"Buy now or miss out!"** – Flagged for artificial urgency and inconsistency with the professional, friendly tone. Suggested correction: "Discover how Nova Tech can support your team today".

---

## 5. Local Setup Instructions

### Prerequisites

- Node.js v18 or higher
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/prachichimandare0906/BrandGuard-AI.git
```

Navigate to the project:

```bash
cd BrandGuard-AI
```

Install dependencies:

```bash
npm install
```

Configure environment variables if required:

```bash
cp .env.example .env
```

Add your Gemini API key to the environment file using the variable name expected by the application.

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

---

## 6. Production Build and Deployment

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The application is intended to serve its compiled frontend and backend APIs through the production server.

**Deployment status:** Public deployment URL will be added after successful deployment.

---

## 7. Round 2 Functional Features

- [x] NOVA TECH demo workspace.
- [x] Brand guideline management.
- [x] Approved facts and terminology management.
- [x] Content submission and document upload.
- [x] Compliance issue detection.
- [x] Severity-based issue reporting.
- [x] Explanations for detected issues.
- [x] Suggested content corrections.
- [x] Creator content revision.
- [x] Human approval workflow.
- [x] Review comments and decisions.
- [x] Content version history.
- [x] Governance analytics dashboard.

*Feature completion should be verified against the actual running application before final submission.*

---

## 8. Round 3 Planned Improvements

1. **Advanced AI and RAG Integration:** Retrieve relevant guideline passages and approved facts to provide evidence-backed compliance recommendations.
2. **Visual Brand Governance:** Detect logo inconsistencies, colour mismatches, typography issues, and accessibility problems.
3. **Enhanced Security and Collaboration:** Add robust authentication, organization-level data isolation, role-based access control, and detailed audit logs.

---

## 9. Expected Impact

BrandGuard AI aims to:

- Improve brand consistency across communication channels.
- Reduce manual content review effort.
- Minimize unsupported claims and inaccurate information.
- Improve collaboration between content creators and brand managers.
- Strengthen brand governance and publishing confidence.

---

## 10. Team

**THE EXCEPTION**

**Prachi Chimandare**  
MIT World Peace University, Pune

---

## 11. Project Links

- **GitHub Repository:** https://github.com/prachichimandare0906/BrandGuard-AI
- **Live Application:** To be added after successful deployment.

---

**BrandGuard AI – Enterprise Brand Governance Platform**  
*CodeNexus Hackathon*
