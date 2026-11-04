import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, initDatabase } from './server/db.js';
import { analyzeWithGemini, AnalysisResult } from './server/gemini.js';
import { analyzeWithRuleEngine } from './server/ruleFallback.js';
import { extractTextFromFile } from './server/documentParser.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seed demo data
initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simulated active session user in memory / header
// Default: Prachi Chimandare (Administrator) or Marcus Sterling (Brand Manager)
let currentActiveUserId = 'usr-2'; // Brand Manager as active default for reviewer workflow

// -------------------------------------------------------------
// USER & ROLE ENDPOINTS
// -------------------------------------------------------------
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, avatar FROM users').all();
  res.json({ users, currentUserId: currentActiveUserId });
});

app.post('/api/users/switch-role', (req, res) => {
  const { userId } = req.body;
  const user = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  currentActiveUserId = userId;
  res.json({ success: true, currentUser: user });
});

// -------------------------------------------------------------
// BRAND KNOWLEDGE HUB: GUIDELINES
// -------------------------------------------------------------
app.get('/api/guidelines', (req, res) => {
  const guidelines = db.prepare('SELECT * FROM guidelines ORDER BY created_at DESC').all();
  res.json(guidelines);
});

app.post('/api/guidelines', (req, res) => {
  const { title, category, description, severity, source_document, prohibited_phrase, preferred_replacement } = req.body;
  if (!title || !category || !description || !severity) {
    return res.status(400).json({ error: 'Title, category, description, and severity are required.' });
  }
  const id = `RULE-${Date.now().toString().slice(-6)}`;
  const createdAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO guidelines (id, title, category, description, severity, source_document, prohibited_phrase, preferred_replacement, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, category, description, severity, source_document || 'Direct Manual Entry', prohibited_phrase || null, preferred_replacement || null, createdAt);

  const created = db.prepare('SELECT * FROM guidelines WHERE id = ?').get(id);
  res.status(201).json(created);
});

app.put('/api/guidelines/:id', (req, res) => {
  const { id } = req.params;
  const { title, category, description, severity, source_document, prohibited_phrase, preferred_replacement } = req.body;
  db.prepare(`
    UPDATE guidelines
    SET title = ?, category = ?, description = ?, severity = ?, source_document = ?, prohibited_phrase = ?, preferred_replacement = ?
    WHERE id = ?
  `).run(title, category, description, severity, source_document, prohibited_phrase || null, preferred_replacement || null, id);

  const updated = db.prepare('SELECT * FROM guidelines WHERE id = ?').get(id);
  res.json(updated);
});

app.delete('/api/guidelines/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM guidelines WHERE id = ?').run(id);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// BRAND KNOWLEDGE HUB: APPROVED FACTS
// -------------------------------------------------------------
app.get('/api/facts', (req, res) => {
  const facts = db.prepare('SELECT * FROM approved_facts ORDER BY verified_at DESC').all();
  res.json(facts);
});

app.post('/api/facts', (req, res) => {
  const { fact, source } = req.body;
  if (!fact || !source) {
    return res.status(400).json({ error: 'Fact statement and verifiable source are required.' });
  }
  const id = `FACT-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO approved_facts (id, fact, source, verified_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, fact, source, now, now);

  const created = db.prepare('SELECT * FROM approved_facts WHERE id = ?').get(id);
  res.status(201).json(created);
});

app.delete('/api/facts/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM approved_facts WHERE id = ?').run(id);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// BRAND KNOWLEDGE HUB: TERMINOLOGY
// -------------------------------------------------------------
app.get('/api/terminology', (req, res) => {
  const terms = db.prepare('SELECT * FROM terminology ORDER BY created_at DESC').all();
  res.json(terms);
});

app.post('/api/terminology', (req, res) => {
  const { prohibited_term, preferred_term, explanation } = req.body;
  if (!prohibited_term || !preferred_term) {
    return res.status(400).json({ error: 'Prohibited term and preferred term are required.' });
  }
  const id = `TERM-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO terminology (id, prohibited_term, preferred_term, explanation, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, prohibited_term, preferred_term, explanation || '', now);

  const created = db.prepare('SELECT * FROM terminology WHERE id = ?').get(id);
  res.status(201).json(created);
});

app.delete('/api/terminology/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM terminology WHERE id = ?').run(id);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// BRAND KNOWLEDGE HUB: ASSETS
// -------------------------------------------------------------
app.get('/api/assets', (req, res) => {
  const assets = db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all();
  res.json(assets);
});

app.post('/api/assets', (req, res) => {
  const { asset_name, asset_type, file_path, guidelines } = req.body;
  if (!asset_name || !asset_type) {
    return res.status(400).json({ error: 'Asset name and type are required.' });
  }
  const id = `ASSET-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO assets (id, asset_name, asset_type, file_path, guidelines, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, asset_name, asset_type, file_path || '/src/assets/images/novatech_brand_logo_1793802331050.jpg', guidelines || '', now);

  const created = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
  res.status(201).json(created);
});

// -------------------------------------------------------------
// DOCUMENT EXTRACTION ENDPOINT
// -------------------------------------------------------------
app.post('/api/documents/parse', async (req, res) => {
  try {
    const { fileBase64, fileName, mimeType } = req.body;
    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: 'File data and fileName required.' });
    }
    const buffer = Buffer.from(fileBase64, 'base64');
    const extracted = await extractTextFromFile(buffer, fileName, mimeType);
    res.json(extracted);
  } catch (err: any) {
    console.error('Document parsing error:', err);
    res.status(500).json({ error: err.message || 'Failed to extract text from document.' });
  }
});

// -------------------------------------------------------------
// CONTENT REVIEW & COMPLIANCE ANALYSIS
// -------------------------------------------------------------
app.post('/api/submissions/analyze', async (req, res) => {
  try {
    const { title, content, content_type, submission_id } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content text is required for analysis.' });
    }

    const currentTitle = title?.trim() || 'Untitled Submission';
    const contentType = content_type || 'Social Media';

    // Retrieve active brand governance knowledge base
    const guidelines = db.prepare('SELECT * FROM guidelines').all() as any[];
    const facts = db.prepare('SELECT * FROM approved_facts').all() as any[];
    const terminology = db.prepare('SELECT * FROM terminology').all() as any[];

    // Attempt Gemini AI first, fallback gracefully to deterministic rule engine
    let analysis: AnalysisResult | null = null;
    let usedAI = false;

    if (process.env.GEMINI_API_KEY) {
      analysis = await analyzeWithGemini(content, contentType, guidelines, facts, terminology);
      if (analysis) {
        usedAI = true;
      }
    }

    if (!analysis) {
      analysis = analyzeWithRuleEngine(content, contentType, guidelines, facts, terminology);
    }

    const now = new Date().toISOString();
    let subId = submission_id;

    if (!subId) {
      // Create new submission
      subId = `SUB-${Date.now().toString().slice(-6)}`;
      db.prepare(`
        INSERT INTO submissions (id, title, content, original_content, content_type, created_by, status, compliance_score, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?)
      `).run(subId, currentTitle, content, content, contentType, currentActiveUserId, analysis.compliance_score, now, now);

      // Save initial version
      db.prepare(`
        INSERT INTO content_versions (id, submission_id, version_number, content, created_at)
        VALUES (?, ?, 1, ?, ?)
      `).run(`VER-${subId}-1`, subId, content, now);
    } else {
      // Update existing submission content and score
      db.prepare(`
        UPDATE submissions
        SET title = ?, content = ?, content_type = ?, compliance_score = ?, updated_at = ?
        WHERE id = ?
      `).run(currentTitle, content, contentType, analysis.compliance_score, now, subId);

      // Delete prior issues to regenerate cleanly
      db.prepare('DELETE FROM compliance_issues WHERE submission_id = ?').run(subId);
    }

    // Save detected issues into compliance_issues table
    const insertIssue = db.prepare(`
      INSERT INTO compliance_issues (id, submission_id, title, category, severity, problematic_text, explanation, source_guideline_id, suggested_correction, confidence, human_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `);

    for (let i = 0; i < analysis.issues.length; i++) {
      const issue = analysis.issues[i];
      const issueId = `ISS-${subId}-${i + 1}`;
      insertIssue.run(
        issueId,
        subId,
        issue.title,
        issue.category,
        issue.severity,
        issue.problematic_text,
        issue.explanation,
        issue.source_guideline_id || null,
        issue.suggested_correction,
        issue.confidence || 'High',
        now
      );
    }

    const savedSubmission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(subId);
    const savedIssues = db.prepare('SELECT * FROM compliance_issues WHERE submission_id = ?').all(subId);

    res.json({
      submission: savedSubmission,
      issues: savedIssues,
      compliance_score: analysis.compliance_score,
      overall_summary: analysis.overall_summary,
      used_ai: usedAI,
    });
  } catch (err: any) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message || 'Error executing compliance analysis.' });
  }
});

// Get all submissions
app.get('/api/submissions', (req, res) => {
  const submissions = db.prepare(`
    SELECT s.*, u.name as author_name, u.role as author_role,
      (SELECT COUNT(*) FROM compliance_issues ci WHERE ci.submission_id = s.id) as total_issues,
      (SELECT COUNT(*) FROM compliance_issues ci WHERE ci.submission_id = s.id AND ci.severity = 'High') as high_issues
    FROM submissions s
    JOIN users u ON s.created_by = u.id
    ORDER BY s.updated_at DESC
  `).all();
  res.json(submissions);
});

// Get single submission with full details
app.get('/api/submissions/:id', (req, res) => {
  const { id } = req.params;
  const submission = db.prepare(`
    SELECT s.*, u.name as author_name, u.role as author_role
    FROM submissions s
    JOIN users u ON s.created_by = u.id
    WHERE s.id = ?
  `).get(id);

  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const issues = db.prepare('SELECT * FROM compliance_issues WHERE submission_id = ? ORDER BY id ASC').all(id);
  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.role as reviewer_role, u.avatar as reviewer_avatar
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    WHERE r.submission_id = ?
    ORDER BY r.created_at DESC
  `).all(id);

  const versions = db.prepare('SELECT * FROM content_versions WHERE submission_id = ? ORDER BY version_number ASC').all(id);

  res.json({
    submission,
    issues,
    reviews,
    versions,
  });
});

// Update submission revised content (Creator applying corrections or editing)
app.patch('/api/submissions/:id/content', (req, res) => {
  const { id } = req.params;
  const { content, compliance_score } = req.body;
  if (content === undefined) {
    return res.status(400).json({ error: 'Content is required.' });
  }

  const now = new Date().toISOString();
  // Get latest version number
  const latestVer = db.prepare('SELECT MAX(version_number) as max_v FROM content_versions WHERE submission_id = ?').get(id) as { max_v: number };
  const nextVer = (latestVer?.max_v || 1) + 1;

  // Insert new content version
  db.prepare(`
    INSERT INTO content_versions (id, submission_id, version_number, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(`VER-${id}-${nextVer}`, id, nextVer, content, now);

  // Update submission
  db.prepare(`
    UPDATE submissions
    SET content = ?, compliance_score = COALESCE(?, compliance_score), updated_at = ?
    WHERE id = ?
  `).run(content, compliance_score !== undefined ? compliance_score : null, now, id);

  const updated = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  res.json({ success: true, submission: updated, version_number: nextVer });
});

// Update human decision on individual issue
app.patch('/api/submissions/:id/issue/:issueId', (req, res) => {
  const { issueId } = req.params;
  const { human_status, suggested_correction } = req.body;
  db.prepare(`
    UPDATE compliance_issues
    SET human_status = COALESCE(?, human_status),
        suggested_correction = COALESCE(?, suggested_correction)
    WHERE id = ?
  `).run(human_status || null, suggested_correction || null, issueId);

  const updated = db.prepare('SELECT * FROM compliance_issues WHERE id = ?').get(issueId);
  res.json(updated);
});

// Creator sends content for approval
app.post('/api/submissions/:id/submit-review', (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE submissions
    SET status = 'In Review', updated_at = ?
    WHERE id = ?
  `).run(now, id);

  const updated = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  res.json({ success: true, submission: updated });
});

// Reviewer (Brand Manager / Admin) makes approval decision
app.post('/api/submissions/:id/review', (req, res) => {
  const { id } = req.params;
  const { decision, comments } = req.body;

  if (!['Approved', 'Rejected', 'Needs Revision'].includes(decision)) {
    return res.status(400).json({ error: 'Valid decision (Approved, Rejected, Needs Revision) required.' });
  }

  // Check reviewer role
  const reviewer = db.prepare('SELECT * FROM users WHERE id = ?').get(currentActiveUserId) as any;
  if (!reviewer || (reviewer.role !== 'brand_manager' && reviewer.role !== 'admin')) {
    return res.status(403).json({ error: 'Only Brand Managers and Administrators have authority to review and approve content.' });
  }

  const now = new Date().toISOString();
  const reviewId = `REV-${Date.now().toString().slice(-6)}`;

  // Insert review record
  db.prepare(`
    INSERT INTO reviews (id, submission_id, reviewer_id, decision, comments, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(reviewId, id, currentActiveUserId, decision, comments || '', now);

  // Update submission status
  db.prepare(`
    UPDATE submissions
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(decision, now, id);

  const updated = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.role as reviewer_role
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    WHERE r.submission_id = ?
    ORDER BY r.created_at DESC
  `).all(id);

  res.json({ success: true, submission: updated, reviews });
});

// -------------------------------------------------------------
// GOVERNANCE ANALYTICS (REAL DATABASE QUERIES)
// -------------------------------------------------------------
app.get('/api/analytics', (req, res) => {
  const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM submissions').get() as { count: number };
  const approvedSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'Approved'").get() as { count: number };
  const rejectedSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'Rejected'").get() as { count: number };
  const inReviewSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'In Review'").get() as { count: number };
  const needsRevisionSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'Needs Revision'").get() as { count: number };
  const totalIssues = db.prepare('SELECT COUNT(*) as count FROM compliance_issues').get() as { count: number };

  const issuesByCategory = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM compliance_issues
    GROUP BY category
    ORDER BY count DESC
  `).all();

  const issuesBySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM compliance_issues
    GROUP BY severity
  `).all();

  const submissionsByStatus = [
    { name: 'Approved', count: approvedSubmissions.count, color: '#0D9488' },
    { name: 'In Review', count: inReviewSubmissions.count, color: '#3B82F6' },
    { name: 'Needs Revision', count: needsRevisionSubmissions.count, color: '#F59E0B' },
    { name: 'Rejected', count: rejectedSubmissions.count, color: '#EF4444' },
    { name: 'Draft', count: Math.max(0, totalSubmissions.count - (approvedSubmissions.count + inReviewSubmissions.count + needsRevisionSubmissions.count + rejectedSubmissions.count)), color: '#64748B' },
  ];

  const topViolatedRules = db.prepare(`
    SELECT g.id, g.title, g.category, COUNT(ci.id) as violations
    FROM guidelines g
    LEFT JOIN compliance_issues ci ON ci.source_guideline_id = g.id
    GROUP BY g.id
    ORDER BY violations DESC
    LIMIT 6
  `).all();

  const repeatedTerminology = db.prepare(`
    SELECT problematic_text as term, COUNT(*) as count, suggested_correction as preferred
    FROM compliance_issues
    WHERE category = 'Terminology'
    GROUP BY problematic_text
    ORDER BY count DESC
    LIMIT 5
  `).all();

  // Detection of unclear guidelines (frequently triggered)
  const unclearGuidelines = topViolatedRules.filter((r: any) => r.violations >= 2);

  res.json({
    metrics: {
      totalSubmissions: totalSubmissions.count,
      approvedSubmissions: approvedSubmissions.count,
      rejectedSubmissions: rejectedSubmissions.count,
      pendingReviews: inReviewSubmissions.count,
      needsRevision: needsRevisionSubmissions.count,
      totalIssues: totalIssues.count,
    },
    submissionsByStatus,
    issuesByCategory,
    issuesBySeverity,
    topViolatedRules,
    repeatedTerminology,
    unclearGuidelines,
  });
});

// Reset demo data endpoint
app.post('/api/reset-demo', (req, res) => {
  db.exec(`
    DELETE FROM reviews;
    DELETE FROM content_versions;
    DELETE FROM compliance_issues;
    DELETE FROM submissions;
    DELETE FROM assets;
    DELETE FROM terminology;
    DELETE FROM approved_facts;
    DELETE FROM guidelines;
    DELETE FROM users;
  `);
  initDatabase();
  currentActiveUserId = 'usr-2';
  res.json({ success: true, message: 'Nova Tech sample brand data re-seeded successfully.' });
});

// -------------------------------------------------------------
// VITE SPA DEV MIDDLEWARE / STATIC PRODUCTION SERVING
// -------------------------------------------------------------
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BrandGuard AI Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
