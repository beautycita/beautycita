const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/issue-screenshots');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `issue-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  next();
};

// Initialize issues table if it doesn't exist
const initIssuesTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      what_wrong TEXT,
      what_doing TEXT,
      what_should_do TEXT,
      page_url TEXT,
      screenshot_url TEXT,
      type VARCHAR(50) CHECK (type IN ('bug', 'feature', 'task', 'improvement')),
      priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
      status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by_name VARCHAR(255),
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE,
      daemon_proposal TEXT,
      action_status VARCHAR(50) DEFAULT 'none' CHECK (action_status IN ('none', 'execute', 'ask_kriket', 'cancel'))
    );

    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
    CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
    CREATE INDEX IF NOT EXISTS idx_issues_created_by ON issues(created_by);
    CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);

    CREATE OR REPLACE FUNCTION update_issues_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      IF NEW.status = 'CLOSED' AND OLD.status != 'CLOSED' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_update_issues_updated_at ON issues;
    CREATE TRIGGER trigger_update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_issues_updated_at();
  `;

  try {
    await db.query(createTableQuery);

    // Add new columns if they don't exist (migration)
    const migrationQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issues' AND column_name='what_wrong') THEN
          ALTER TABLE issues ADD COLUMN what_wrong TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issues' AND column_name='what_doing') THEN
          ALTER TABLE issues ADD COLUMN what_doing TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issues' AND column_name='what_should_do') THEN
          ALTER TABLE issues ADD COLUMN what_should_do TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issues' AND column_name='page_url') THEN
          ALTER TABLE issues ADD COLUMN page_url TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issues' AND column_name='screenshot_url') THEN
          ALTER TABLE issues ADD COLUMN screenshot_url TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issues' AND column_name='created_by_name') THEN
          ALTER TABLE issues ADD COLUMN created_by_name VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issues' AND column_name='daemon_proposal') THEN
          ALTER TABLE issues ADD COLUMN daemon_proposal TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issues' AND column_name='action_status') THEN
          ALTER TABLE issues ADD COLUMN action_status VARCHAR(50) DEFAULT 'none' CHECK (action_status IN ('none', 'execute', 'ask_kriket', 'cancel'));
        END IF;
      END $$;
    `;

    await db.query(migrationQuery);
    console.log('✅ Issues table initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing issues table:', error);
  }
};

// Initialize table on module load
initIssuesTable();

/**
 * GET /api/issues
 * Get all issues
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { type, status, priority } = req.query;

    let query = 'SELECT * FROM issues WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);

    // Return response structure that frontend expects
    res.json({ issues: result.rows });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues', message: error.message });
  }
});

/**
 * GET /api/issues/:id
 * Get a specific issue
 */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM issues WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({ error: 'Failed to fetch issue', message: error.message });
  }
});

/**
 * POST /api/issues
 * Create a new issue
 */
router.post('/', requireAdmin, upload.single('screenshot'), async (req, res) => {
  try {
    const {
      what_wrong,
      what_doing,
      what_should_do,
      page_url,
      priority
    } = req.body;

    // Get user info for created_by_name
    const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
    const userName = userResult.rows[0]?.name || userResult.rows[0]?.email || 'Unknown';

    // Build screenshot URL if file was uploaded
    let screenshotUrl = null;
    if (req.file) {
      screenshotUrl = `/uploads/issue-screenshots/${req.file.filename}`;
    }

    const result = await db.query(
      `INSERT INTO issues (
        what_wrong, what_doing, what_should_do, page_url, screenshot_url,
        priority, status, created_by, created_by_name
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        what_wrong || null,
        what_doing || null,
        what_should_do || null,
        page_url || null,
        screenshotUrl,
        priority || 'MEDIUM',
        'OPEN',
        req.user.id,
        userName
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create issue', message: error.message });
  }
});

/**
 * PUT /api/issues/:id
 * Update an issue
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      priority,
      status,
      assigned_to,
      steps_to_reproduce,
      expected_behavior,
      actual_behavior,
      affected_files,
      error_message,
      environment,
      daemon_proposal,
      action_status
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      params.push(title);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (type !== undefined) {
      updates.push(`type = $${paramCount}`);
      params.push(type);
      paramCount++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
      paramCount++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramCount}`);
      params.push(assigned_to);
      paramCount++;
    }

    if (steps_to_reproduce !== undefined) {
      updates.push(`steps_to_reproduce = $${paramCount}`);
      params.push(steps_to_reproduce);
      paramCount++;
    }

    if (expected_behavior !== undefined) {
      updates.push(`expected_behavior = $${paramCount}`);
      params.push(expected_behavior);
      paramCount++;
    }

    if (actual_behavior !== undefined) {
      updates.push(`actual_behavior = $${paramCount}`);
      params.push(actual_behavior);
      paramCount++;
    }

    if (affected_files !== undefined) {
      updates.push(`affected_files = $${paramCount}`);
      params.push(affected_files);
      paramCount++;
    }

    if (error_message !== undefined) {
      updates.push(`error_message = $${paramCount}`);
      params.push(error_message);
      paramCount++;
    }

    if (environment !== undefined) {
      updates.push(`environment = $${paramCount}`);
      params.push(environment);
      paramCount++;
    }

    if (daemon_proposal !== undefined) {
      updates.push(`daemon_proposal = $${paramCount}`);
      params.push(daemon_proposal);
      paramCount++;
    }

    if (action_status !== undefined) {
      updates.push(`action_status = $${paramCount}`);
      params.push(action_status);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const query = `UPDATE issues SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const updatedIssue = result.rows[0];

    // Send email alert to super admin when action_status changes to execute or ask_kriket
    if (action_status && (action_status === 'execute' || action_status === 'ask_kriket')) {
      try {
        const emailService = require('./emailService');
        const superAdminsResult = await db.query('SELECT email, name FROM users WHERE role = $1', ['SUPERADMIN']);

        for (const admin of superAdminsResult.rows) {
          const actionText = action_status === 'execute' ? '✅ Execute Proposal' : '❓ Ask Kriket for Approval';
          await emailService.sendEmail({
            to: admin.email,
            subject: `🤖 Issue Action Required: ${updatedIssue.title}`,
            html: `
              <div style="font-family: Arial, sans-serif;">
                <h2>Issue Action Required</h2>
                <p>Hi ${admin.name},</p>
                <p>An action has been set for issue <strong>#${updatedIssue.id}: ${updatedIssue.title}</strong></p>

                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Issue Details</h3>
                  <p><strong>Type:</strong> ${updatedIssue.type}</p>
                  <p><strong>Priority:</strong> ${updatedIssue.priority}</p>
                  <p><strong>Status:</strong> ${updatedIssue.status}</p>
                  <p><strong>Description:</strong> ${updatedIssue.description}</p>
                </div>

                ${daemon_proposal ? `
                <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">🤖 Daemon Proposal</h3>
                  <p>${daemon_proposal}</p>
                </div>
                ` : ''}

                <div style="background: ${action_status === 'execute' ? '#d1fae5' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">${actionText}</h3>
                  <p>${action_status === 'execute' ? 'The proposed solution will be executed.' : 'Your approval is required before proceeding.'}</p>
                </div>

                <p>
                  <a href="${process.env.FRONTEND_URL || 'https://beautycita.com'}/admin/issues/${updatedIssue.id}"
                     style="background: linear-gradient(to right, #ec4899, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    View Issue
                  </a>
                </p>

                <p>Best regards,<br>BeautyCita Issue Tracker</p>
              </div>
            `
          });
        }
      } catch (emailError) {
        console.error('Error sending admin alert email:', emailError);
        // Don't fail the update if email fails
      }
    }

    res.json(updatedIssue);
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update issue', message: error.message });
  }
});

/**
 * DELETE /api/issues/:id
 * Delete an issue
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM issues WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ message: 'Issue deleted successfully', issue: result.rows[0] });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ error: 'Failed to delete issue', message: error.message });
  }
});

/**
 * GET /api/issues/stats/summary
 * Get issue statistics
 */
router.get('/stats/summary', requireAdmin, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'todo') as todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'done') as done,
        COUNT(*) FILTER (WHERE type = 'bug') as bugs,
        COUNT(*) FILTER (WHERE type = 'feature') as features,
        COUNT(*) FILTER (WHERE type = 'task') as tasks,
        COUNT(*) FILTER (WHERE type = 'improvement') as improvements,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical,
        COUNT(*) FILTER (WHERE priority = 'high') as high
      FROM issues
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching issue stats:', error);
    res.status(500).json({ error: 'Failed to fetch issue stats', message: error.message });
  }
});

module.exports = router;
