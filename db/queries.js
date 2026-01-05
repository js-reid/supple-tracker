// Supplement queries
const getAllSupplements = `
  SELECT * FROM supplements
  ORDER BY sort_order ASC, name ASC
`;

const createSupplement = `
  INSERT INTO supplements (name, default_dosage, button_color, sort_order)
  VALUES (@name, @default_dosage, @button_color, @sort_order)
`;

const updateSupplement = `
  UPDATE supplements
  SET name = @name,
      default_dosage = @default_dosage,
      button_color = @button_color,
      sort_order = @sort_order
  WHERE id = @id
`;

const deleteSupplement = `
  DELETE FROM supplements WHERE id = @id
`;

// Log queries
const createLog = `
  INSERT INTO logs (supplement_id, taken_at, dosage, notes)
  VALUES (@supplement_id, @taken_at, @dosage, @notes)
`;

const getAllLogs = `
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
`;

const updateLog = `
  UPDATE logs
  SET taken_at = @taken_at,
      dosage = @dosage,
      notes = @notes,
      updated_at = @updated_at
  WHERE id = @id
`;

const deleteLog = `
  DELETE FROM logs WHERE id = @id
`;

const getLastTakenTimestamps = `
  SELECT
    supplements.id as supplement_id,
    supplements.name,
    MAX(logs.taken_at) as last_taken
  FROM supplements
  LEFT JOIN logs ON supplements.id = logs.supplement_id
  GROUP BY supplements.id, supplements.name
`;

module.exports = {
  getAllSupplements,
  createSupplement,
  updateSupplement,
  deleteSupplement,
  createLog,
  getAllLogs,
  updateLog,
  deleteLog,
  getLastTakenTimestamps
};
