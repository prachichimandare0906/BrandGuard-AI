import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'brandguard.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('creator', 'brand_manager', 'admin')),
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS guidelines (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Tone', 'Terminology', 'Messaging', 'Facts', 'Claims', 'Visual identity', 'Accessibility')),
      description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('High', 'Medium', 'Low')),
      source_document TEXT,
      prohibited_phrase TEXT,
      preferred_replacement TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approved_facts (
      id TEXT PRIMARY KEY,
      fact TEXT NOT NULL,
      source TEXT NOT NULL,
      verified_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS terminology (
      id TEXT PRIMARY KEY,
      prohibited_term TEXT NOT NULL,
      preferred_term TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      asset_name TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      guidelines TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      original_content TEXT NOT NULL,
      content_type TEXT NOT NULL,
      created_by TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Draft', 'In Review', 'Needs Revision', 'Approved', 'Rejected')),
      compliance_score INTEGER NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS compliance_issues (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('High', 'Medium', 'Low')),
      problematic_text TEXT NOT NULL,
      explanation TEXT NOT NULL,
      source_guideline_id TEXT,
      suggested_correction TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'High',
      human_status TEXT NOT NULL DEFAULT 'Pending' CHECK(human_status IN ('Pending', 'Accepted', 'Rejected', 'Modified')),
      created_at TEXT NOT NULL,
      FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('Approved', 'Rejected', 'Needs Revision')),
      comments TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      FOREIGN KEY(reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS content_versions (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );
  `);

  seedDefaultData();
}

function seedDefaultData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  // Preload default users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr-1',
    'Elena Vance',
    'creator@novatech.io',
    'pbkdf2$e1$mockhashedpasscreator',
    'creator',
    '/src/assets/images/avatar_brand_manager_1793802330741.jpg'
  );
  insertUser.run(
    'usr-2',
    'Marcus Sterling',
    'manager@novatech.io',
    'pbkdf2$e1$mockhashedpassmanager',
    'brand_manager',
    '/src/assets/images/avatar_brand_manager_1793802330741.jpg'
  );
  insertUser.run(
    'usr-3',
    'Prachi Chimandare',
    'prachi.chimandare@mitwpu.edu.in',
    'pbkdf2$e1$mockhashedpassadmin',
    'admin',
    '/src/assets/images/avatar_brand_manager_1793802330741.jpg'
  );

  // Preload sample brand guidelines for NOVA TECH
  const insertGuideline = db.prepare(`
    INSERT INTO guidelines (id, title, category, description, severity, source_document, prohibited_phrase, preferred_replacement, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertGuideline.run(
    'RULE-TONE-01',
    'Professional, Friendly & Informative Voice',
    'Tone',
    'Nova Tech communicates in an authoritative, supportive, and informative manner. Avoid aggressive urgency, artificial scarcity, pushy hype, or sensationalist slogans.',
    'Medium',
    'NovaTech_Brand_Voice_v2.4.pdf',
    'Buy now or miss out!',
    'Discover how Nova Tech can support your team today.',
    '2026-01-15T10:00:00Z'
  );

  insertGuideline.run(
    'RULE-TERM-01',
    'Refer to Clientele as Customers or Partners',
    'Terminology',
    'Always use "customers" or "partners" instead of "users" in public marketing, advertising, and external press communications to convey respect and human relationship.',
    'Medium',
    'NovaTech_Corporate_Glossary_2026.docx',
    'users',
    'customers',
    '2026-01-15T10:00:00Z'
  );

  insertGuideline.run(
    'RULE-CLAIM-01',
    'No Unsupported Performance Guarantees',
    'Claims',
    'Never promise guaranteed financial, operational, or latency outcomes without approved legal disclaimers and empirical test evidence.',
    'High',
    'NovaTech_Legal_Compliance_Standards.pdf',
    'guarantees results',
    'is designed to deliver measurable results',
    '2026-01-15T10:00:00Z'
  );

  insertGuideline.run(
    'RULE-CLAIM-02',
    'Prohibit Unsubstantiated Superlatives',
    'Claims',
    'Avoid superlative phrasing such as "the best ever", "#1 ranked", or "flawless" unless supported by named third-party analyst reports (e.g. Gartner, Forrester).',
    'High',
    'NovaTech_Brand_Voice_v2.4.pdf',
    'the best ever',
    'an industry-leading solution',
    '2026-01-15T10:00:00Z'
  );

  insertGuideline.run(
    'RULE-FACT-01',
    'Ground Corporate Heritage in Verified Facts',
    'Facts',
    'All dates, metrics, and regional presence claims must match official corporate records. Nova Tech was founded in 2018 in Bengaluru and operates in India and Singapore.',
    'High',
    'NovaTech_Fact_Sheet_Q1_2026.txt',
    null,
    null,
    '2026-01-15T10:00:00Z'
  );

  insertGuideline.run(
    'RULE-ACC-01',
    'Accessibility & Descriptive Text Standards',
    'Accessibility',
    'All published graphical media must contain meaningful descriptive alt text. Avoid relying solely on color to convey critical product status or pricing tier.',
    'Medium',
    'NovaTech_Digital_Accessibility_Guidelines.pdf',
    null,
    null,
    '2026-01-15T10:00:00Z'
  );

  insertGuideline.run(
    'RULE-VIS-01',
    'Approved Corporate Logo Usage',
    'Visual identity',
    'Only use the approved hexagonal Nova Tech corporate emblem. Do not distort, rotate, recolor into arbitrary gradients, or apply drop shadows.',
    'High',
    'NovaTech_Visual_Identity_Manual.pdf',
    null,
    null,
    '2026-01-15T10:00:00Z'
  );

  insertGuideline.run(
    'RULE-MSG-01',
    'Customer-Centric Value Messaging',
    'Messaging',
    'Focus copy on customer empowerment and transparent engineering. Refrain from disparaging competitors by name or issuing fear-based security warnings.',
    'Medium',
    'NovaTech_Brand_Voice_v2.4.pdf',
    'competitor inferior',
    'proven industry architecture',
    '2026-01-15T10:00:00Z'
  );

  // Preload approved facts
  const insertFact = db.prepare(`
    INSERT INTO approved_facts (id, fact, source, verified_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertFact.run('FACT-01', 'Nova Tech was founded in 2018 in Bengaluru, India.', 'Certificate of Incorporation (2018)', '2026-01-10T00:00:00Z', '2026-01-10T00:00:00Z');
  insertFact.run('FACT-02', 'Nova Tech enterprise cloud suite is officially available in India, Singapore, and North America.', 'Corporate Market Directory Q1 2026', '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z');
  insertFact.run('FACT-03', 'Nova Tech holds active ISO/IEC 27001:2022 and SOC 2 Type II compliance certifications.', 'Global Trust & Security Audit 2025', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z');
  insertFact.run('FACT-04', 'Nova Tech infrastructure achieves 99.99% verified uptime SLA.', 'Engineering SLA Quarterly Report', '2026-02-01T00:00:00Z', '2026-02-01T00:00:00Z');

  // Preload terminology
  const insertTerm = db.prepare(`
    INSERT INTO terminology (id, prohibited_term, preferred_term, explanation, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertTerm.run('TERM-01', 'users', 'customers', 'In outbound marketing, use "customers" or "partners" to build meaningful client rapport.', '2026-01-10T00:00:00Z');
  insertTerm.run('TERM-02', 'cheap', 'cost-effective', 'Preserve premium enterprise brand positioning by avoiding cheap or bargain language.', '2026-01-10T00:00:00Z');
  insertTerm.run('TERM-03', 'guarantees', 'is designed to deliver', 'Legal compliance requires avoiding uncertified performance guarantees.', '2026-01-10T00:00:00Z');
  insertTerm.run('TERM-04', 'best ever', 'industry-leading', 'Superlatives must be substantiated by licensed third-party benchmark reports.', '2026-01-10T00:00:00Z');
  insertTerm.run('TERM-05', 'hacky', 'innovative agile', 'Avoid informal engineering slang that undermines enterprise stability confidence.', '2026-01-10T00:00:00Z');

  // Preload brand assets
  const insertAsset = db.prepare(`
    INSERT INTO assets (id, asset_name, asset_type, file_path, guidelines, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAsset.run(
    'ASSET-01',
    'Nova Tech Primary Hexagon Mark',
    'Logo',
    '/src/assets/images/novatech_brand_logo_1793802331050.jpg',
    'Use on clean light backgrounds with minimum 24px clear margin space on all sides.',
    '2026-01-15T00:00:00Z'
  );
  insertAsset.run(
    'ASSET-02',
    'Corporate Palette: Deep Navy (#0F172A) & Cyan Teal (#0D9488)',
    'Color Palette',
    '#0F172A, #0D9488, #F8FAFC',
    'Navy is 60% neutral baseline; Cyan Teal is 10% high-intent action accent.',
    '2026-01-15T00:00:00Z'
  );
  insertAsset.run(
    'ASSET-03',
    'Brand Typography: Plus Jakarta Sans',
    'Typography',
    'Google Fonts: Plus Jakarta Sans for titles/body, JetBrains Mono for metrics.',
    'Weights: 400 Regular for prose, 600 SemiBold for titles, 700 Bold for hero marks.',
    '2026-01-15T00:00:00Z'
  );

  // Preload historical submissions for immediate realistic analytics
  const insertSubmission = db.prepare(`
    INSERT INTO submissions (id, title, content, original_content, content_type, created_by, status, compliance_score, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertIssue = db.prepare(`
    INSERT INTO compliance_issues (id, submission_id, title, category, severity, problematic_text, explanation, source_guideline_id, suggested_correction, confidence, human_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (id, submission_id, reviewer_id, decision, comments, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertVersion = db.prepare(`
    INSERT INTO content_versions (id, submission_id, version_number, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Submission 1: Approved
  insertSubmission.run(
    'SUB-2026-001',
    'Q1 Cloud Suite Launch Announcement',
    'Nova Tech was founded in 2018 with a mission to deliver resilient digital infrastructure. Today, our enterprise cloud suite is officially available in India, Singapore, and North America. Over 1,200 enterprise customers rely on our verified 99.99% uptime SLA to scale mission-critical workloads.',
    'Nova Tech was founded in 2018 with a mission to deliver resilient digital infrastructure. Today, our enterprise cloud suite is officially available in India, Singapore, and North America. Over 1,200 enterprise customers rely on our verified 99.99% uptime SLA to scale mission-critical workloads.',
    'Press Release',
    'usr-1',
    'Approved',
    96,
    '2026-02-14T11:20:00Z',
    '2026-02-14T14:45:00Z'
  );
  insertVersion.run('VER-001-1', 'SUB-2026-001', 1, 'Nova Tech was founded in 2018 with a mission to deliver resilient digital infrastructure...', '2026-02-14T11:20:00Z');
  insertReview.run('REV-001', 'SUB-2026-001', 'usr-2', 'Approved', 'Complies with all Nova Tech approved facts and brand tone standards. Verified against Q1 Market Directory.', '2026-02-14T14:45:00Z');

  // Submission 2: Needs Revision
  insertSubmission.run(
    'SUB-2026-002',
    'Spring Promotional Email Campaign',
    'Attention users: Nova Tech is the best ever tool for workflow automation. Our software guarantees results within 48 hours! Sign up now or miss out on cheap monthly rates.',
    'Attention users: Nova Tech is the best ever tool for workflow automation. Our software guarantees results within 48 hours! Sign up now or miss out on cheap monthly rates.',
    'Email Campaign',
    'usr-1',
    'Needs Revision',
    42,
    '2026-02-20T09:15:00Z',
    '2026-02-20T10:30:00Z'
  );
  insertVersion.run('VER-002-1', 'SUB-2026-002', 1, 'Attention users: Nova Tech is the best ever tool for workflow automation...', '2026-02-20T09:15:00Z');
  insertIssue.run(
    'ISS-002-1',
    'SUB-2026-002',
    'Prohibited Terminology: "users"',
    'Terminology',
    'Medium',
    'users',
    'Nova Tech glossary dictates using "customers" or "partners" in external marketing.',
    'RULE-TERM-01',
    'customers',
    'High',
    'Pending',
    '2026-02-20T09:16:00Z'
  );
  insertIssue.run(
    'ISS-002-2',
    'SUB-2026-002',
    'Unsubstantiated Superlative',
    'Claims',
    'High',
    'the best ever',
    'Superlatives require official third-party research benchmark citations.',
    'RULE-CLAIM-02',
    'an industry-leading',
    'High',
    'Pending',
    '2026-02-20T09:16:00Z'
  );
  insertIssue.run(
    'ISS-002-3',
    'SUB-2026-002',
    'Unsupported Performance Guarantee',
    'Claims',
    'High',
    'guarantees results',
    'Performance guarantees violate legal compliance guidelines without certified trial metrics.',
    'RULE-CLAIM-01',
    'is designed to deliver measurable results',
    'High',
    'Pending',
    '2026-02-20T09:16:00Z'
  );
  insertIssue.run(
    'ISS-002-4',
    'SUB-2026-002',
    'Aggressive Scarcity & Cheap Phrasing',
    'Tone',
    'Medium',
    'or miss out on cheap monthly rates',
    'Violates professional tone guideline and premium market positioning.',
    'RULE-TONE-01',
    'and explore our cost-effective monthly plans',
    'High',
    'Pending',
    '2026-02-20T09:16:00Z'
  );
  insertReview.run('REV-002', 'SUB-2026-002', 'usr-2', 'Needs Revision', 'Contains multiple high-severity claims and prohibited terms. Please apply suggested AI corrections before resubmitting.', '2026-02-20T10:30:00Z');
}
