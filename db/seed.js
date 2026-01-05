const { initDatabase, dbRun, dbGet, dbAll } = require('./init');

async function seedDatabase() {
  console.log('Seeding database...');

  // Sample supplements to add
  const supplements = [
    { name: 'Vitamin D3', default_dosage: '5000 IU', button_color: '#eab308', sort_order: 1 },
    { name: 'Omega-3', default_dosage: '1000mg', button_color: '#3b82f6', sort_order: 2 },
    { name: 'Magnesium', default_dosage: '400mg', button_color: '#22c55e', sort_order: 3 },
    { name: 'Vitamin C', default_dosage: '1000mg', button_color: '#f97316', sort_order: 4 },
    { name: 'Zinc', default_dosage: '50mg', button_color: '#8b5cf6', sort_order: 5 },
    { name: 'B-Complex', default_dosage: '1 capsule', button_color: '#ec4899', sort_order: 6 }
  ];

  // Check if supplements already exist
  const existingCount = await dbGet('SELECT COUNT(*) as count FROM supplements');

  if (existingCount.count > 0) {
    console.log(`Database already has ${existingCount.count} supplements. Skipping seed.`);
    return;
  }

  // Insert supplements
  for (const supplement of supplements) {
    await dbRun(`
      INSERT INTO supplements (name, default_dosage, button_color, sort_order)
      VALUES (?, ?, ?, ?)
    `, [supplement.name, supplement.default_dosage, supplement.button_color, supplement.sort_order]);
    console.log(`  - Added: ${supplement.name}`);
  }

  console.log(`Seeded ${supplements.length} supplements successfully!`);
}

// Run seed if called directly
if (require.main === module) {
  initDatabase()
    .then(() => seedDatabase())
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error seeding database:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
