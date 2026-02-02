const express = require('express');
const path = require('path');
const { initDatabase, dbRun, dbGet, dbAll } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('  Body:', JSON.stringify(req.body));
  }
  next();
});

app.use(express.static('public'));

// API Routes

// Get all supplements
app.get('/api/supplements', async (req, res) => {
  try {
    const supplements = await dbAll(`
      SELECT * FROM supplements
      ORDER BY sort_order ASC, name ASC
    `);
    res.json(supplements);
  } catch (error) {
    console.error('Error fetching supplements:', error);
    res.status(500).json({ error: 'Failed to fetch supplements' });
  }
});

// Create new supplement
app.post('/api/supplements', async (req, res) => {
  try {
    const { name, default_dosage, button_color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Get max sort_order
    const maxOrder = await dbGet('SELECT MAX(sort_order) as max FROM supplements');
    const sort_order = (maxOrder.max || 0) + 1;

    const result = await dbRun(`
      INSERT INTO supplements (name, default_dosage, button_color, sort_order)
      VALUES (?, ?, ?, ?)
    `, [name, default_dosage || null, button_color || '#6c757d', sort_order]);

    res.json({
      id: result.lastID,
      name,
      default_dosage,
      button_color: button_color || '#6c757d',
      sort_order
    });
  } catch (error) {
    console.error('Error creating supplement:', error);
    res.status(500).json({ error: 'Failed to create supplement' });
  }
});

// Update supplement
app.put('/api/supplements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, default_dosage, button_color, sort_order } = req.body;

    const result = await dbRun(`
      UPDATE supplements
      SET name = ?,
          default_dosage = ?,
          button_color = ?,
          sort_order = ?
      WHERE id = ?
    `, [name, default_dosage, button_color, sort_order, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Supplement not found' });
    }

    res.json({ id, name, default_dosage, button_color, sort_order });
  } catch (error) {
    console.error('Error updating supplement:', error);
    res.status(500).json({ error: 'Failed to update supplement' });
  }
});

// Delete supplement
app.delete('/api/supplements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM supplements WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Supplement not found' });
    }

    res.json({ message: 'Supplement deleted' });
  } catch (error) {
    console.error('Error deleting supplement:', error);
    res.status(500).json({ error: 'Failed to delete supplement' });
  }
});

// Log a supplement intake
app.post('/api/log', async (req, res) => {
  try {
    const { supplement_id, taken_at, dosage, notes } = req.body;

    if (!supplement_id || !dosage) {
      return res.status(400).json({ error: 'supplement_id and dosage are required' });
    }

    // Verify supplement exists
    const supplement = await dbGet('SELECT id, name FROM supplements WHERE id = ?', [supplement_id]);
    if (!supplement) {
      return res.status(404).json({
        error: 'Supplement not found',
        message: `No supplement exists with id ${supplement_id}. Create it in Settings first or check GET /api/supplements for valid IDs.`
      });
    }

    const result = await dbRun(`
      INSERT INTO logs (supplement_id, taken_at, dosage, notes)
      VALUES (?, ?, ?, ?)
    `, [supplement_id, taken_at || new Date().toISOString(), dosage, notes || null]);

    res.json({
      id: result.lastID,
      supplement_id,
      supplement_name: supplement.name,
      taken_at: taken_at || new Date().toISOString(),
      dosage,
      notes
    });
  } catch (error) {
    console.error('Error creating log:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({
        error: 'Invalid supplement_id',
        message: 'The supplement_id does not exist. Create the supplement first or check GET /api/supplements for valid IDs.'
      });
    } else {
      res.status(500).json({ error: 'Failed to create log' });
    }
  }
});

// Get all logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await dbAll(`
      SELECT
        logs.id,
        logs.supplement_id,
        supplements.name as supplement_name,
        logs.taken_at,
        logs.dosage,
        logs.notes,
        logs.created_at,
        logs.updated_at
      FROM logs
      JOIN supplements ON logs.supplement_id = supplements.id
      ORDER BY logs.taken_at DESC
    `);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get last taken timestamp and dosage for each supplement
app.get('/api/supplements/last-taken', async (req, res) => {
  try {
    const lastTaken = await dbAll(`
      SELECT
        supplements.id as supplement_id,
        supplements.name,
        logs.taken_at as last_taken,
        logs.dosage as last_dosage
      FROM supplements
      LEFT JOIN logs ON supplements.id = logs.supplement_id
        AND logs.id = (
          SELECT id FROM logs l2
          WHERE l2.supplement_id = supplements.id
          ORDER BY l2.taken_at DESC
          LIMIT 1
        )
    `);
    res.json(lastTaken);
  } catch (error) {
    console.error('Error fetching last taken timestamps:', error);
    res.status(500).json({ error: 'Failed to fetch last taken timestamps' });
  }
});

// Update a log entry
app.put('/api/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { taken_at, dosage, notes } = req.body;

    const result = await dbRun(`
      UPDATE logs
      SET taken_at = ?,
          dosage = ?,
          notes = ?,
          updated_at = ?
      WHERE id = ?
    `, [taken_at, dosage, notes, new Date().toISOString(), id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({ id, taken_at, dosage, notes });
  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({ error: 'Failed to update log' });
  }
});

// Delete a log entry
app.delete('/api/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM logs WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({ message: 'Log deleted' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// Export logs as CSV
app.get('/api/export/csv', async (req, res) => {
  try {
    const logs = await dbAll(`
      SELECT
        supplements.name as supplement_name,
        logs.taken_at,
        logs.dosage,
        logs.notes
      FROM logs
      JOIN supplements ON logs.supplement_id = supplements.id
      ORDER BY logs.taken_at DESC
    `);

    // Create CSV content
    const headers = ['Supplement', 'Taken At', 'Dosage', 'Notes'];
    const rows = logs.map(log => [
      log.supplement_name,
      log.taken_at,
      log.dosage,
      log.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="supplement-logs.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export logs as JSON
app.get('/api/export/json', async (req, res) => {
  try {
    const logs = await dbAll(`
      SELECT
        logs.id,
        logs.supplement_id,
        supplements.name as supplement_name,
        logs.taken_at,
        logs.dosage,
        logs.notes,
        logs.created_at,
        logs.updated_at
      FROM logs
      JOIN supplements ON logs.supplement_id = supplements.id
      ORDER BY logs.taken_at DESC
    `);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="supplement-logs.json"');
    res.json(logs);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    res.status(500).json({ error: 'Failed to export JSON' });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/calendar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calendar.html'));
});

// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.path,
    message: `The endpoint ${req.method} ${req.path} does not exist. Check the API documentation.`
  });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Supple Tracker running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
