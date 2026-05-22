const { db, initDb } = require("./db");
const demoProvider = require("./providers/demoProvider");

async function refreshPrices() {
  const products = db.prepare(`
    SELECT external_id, price, url, store
    FROM products
  `).all();

  const updates = await demoProvider.fetchLatestPrices(products);

  const updateStmt = db.prepare(`
    UPDATE products
    SET price = @price,
        url = COALESCE(@url, url),
        store = COALESCE(@store, store),
        updated_at = CURRENT_TIMESTAMP
    WHERE external_id = @external_id
  `);

  const transaction = db.transaction((items) => {
    for (const item of items) updateStmt.run(item);
  });

  transaction(updates);

  return {
    updated: updates.length,
    updatedAt: new Date().toISOString()
  };
}

if (require.main === module) {
  initDb();
  refreshPrices()
    .then(result => {
      console.log(result);
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { refreshPrices };
