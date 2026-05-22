const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "products.sqlite");
const db = new Database(dbPath);

const seedProducts = [
  {
    external_id: "logitech-mx-keys",
    name: "Logitech MX Keys Keyboard",
    category: "Keyboard",
    specs: "Wireless • Backlit • Bluetooth",
    price: 99.99,
    currency: "USD",
    store: "Amazon",
    rating: 4.8,
    reviews: 12456,
    icon: "⌨️",
    url: "https://www.amazon.com/s?k=Logitech+MX+Keys+Keyboard",
    keywords: "keyboard wireless bluetooth logitech mx keys office productivity"
  },
  {
    external_id: "dell-27-monitor",
    name: "Dell 27-inch Monitor",
    category: "Monitor",
    specs: "1440p • 75Hz • IPS",
    price: 189.99,
    currency: "USD",
    store: "Best Buy",
    rating: 4.6,
    reviews: 8932,
    icon: "🖥️",
    url: "https://www.bestbuy.com/site/searchpage.jsp?st=Dell+27+inch+Monitor",
    keywords: "monitor display dell 27 inch 1440p ips screen"
  },
  {
    external_id: "macbook-air-m3",
    name: "Apple MacBook Air M3",
    category: "Laptop",
    specs: "8GB RAM • 256GB SSD • 13-inch",
    price: 1099.00,
    currency: "USD",
    store: "Apple",
    rating: 4.9,
    reviews: 5672,
    icon: "💻",
    url: "https://www.apple.com/macbook-air/",
    keywords: "laptop macbook apple m3 macbook air notebook"
  },
  {
    external_id: "samsung-870-evo-1tb",
    name: "Samsung 1TB SSD 870 EVO",
    category: "Storage",
    specs: "SATA III • 2.5 Inch • Up to 560MB/s",
    price: 84.99,
    currency: "USD",
    store: "Newegg",
    rating: 4.7,
    reviews: 11203,
    icon: "▰",
    url: "https://www.newegg.com/p/pl?d=Samsung+1TB+SSD+870+EVO",
    keywords: "ssd storage samsung 1tb 870 evo drive sata"
  },
  {
    external_id: "rtx-4070-super",
    name: "NVIDIA GeForce RTX 4070 Super",
    category: "Graphics Card",
    specs: "12GB GDDR6X • Ray Tracing • DLSS",
    price: 599.99,
    currency: "USD",
    store: "Micro Center",
    rating: 4.8,
    reviews: 3421,
    icon: "▣",
    url: "https://www.microcenter.com/search/search_results.aspx?Ntt=RTX+4070+Super",
    keywords: "gpu graphics card nvidia rtx 4070 gaming"
  },
  {
    external_id: "razer-deathadder-v3",
    name: "Razer DeathAdder V3",
    category: "Mouse",
    specs: "Wired • 30K DPI • Ergonomic",
    price: 69.99,
    currency: "USD",
    store: "Amazon",
    rating: 4.5,
    reviews: 6420,
    icon: "🖱️",
    url: "https://www.amazon.com/s?k=Razer+DeathAdder+V3",
    keywords: "mouse gaming mouse razer deathadder dpi"
  },
  {
    external_id: "sony-wh-1000xm5",
    name: "Sony WH-1000XM5",
    category: "Headphones",
    specs: "Wireless • Noise Cancelling • Bluetooth",
    price: 328.00,
    currency: "USD",
    store: "Best Buy",
    rating: 4.7,
    reviews: 9122,
    icon: "🎧",
    url: "https://www.bestbuy.com/site/searchpage.jsp?st=Sony+WH-1000XM5",
    keywords: "headphones sony wireless noise cancelling bluetooth"
  },
  {
    external_id: "anker-usb-c-hub",
    name: "Anker USB-C Hub",
    category: "Accessory",
    specs: "7-in-1 • HDMI • USB-C PD • SD Reader",
    price: 39.99,
    currency: "USD",
    store: "Amazon",
    rating: 4.6,
    reviews: 22081,
    icon: "🔌",
    url: "https://www.amazon.com/s?k=Anker+USB-C+Hub",
    keywords: "usb hub adapter anker accessory hdmi usbc"
  }
];

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      specs TEXT,
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      store TEXT NOT NULL,
      rating REAL DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      icon TEXT DEFAULT '▣',
      url TEXT,
      keywords TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);

    CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
      name,
      category,
      specs,
      store,
      keywords,
      content='products',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
      INSERT INTO products_fts(rowid, name, category, specs, store, keywords)
      VALUES (new.id, new.name, new.category, new.specs, new.store, new.keywords);
    END;

    CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
      INSERT INTO products_fts(products_fts, rowid, name, category, specs, store, keywords)
      VALUES('delete', old.id, old.name, old.category, old.specs, old.store, old.keywords);
    END;

    CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
      INSERT INTO products_fts(products_fts, rowid, name, category, specs, store, keywords)
      VALUES('delete', old.id, old.name, old.category, old.specs, old.store, old.keywords);
      INSERT INTO products_fts(rowid, name, category, specs, store, keywords)
      VALUES (new.id, new.name, new.category, new.specs, new.store, new.keywords);
    END;
  `);

  const insert = db.prepare(`
    INSERT INTO products (
      external_id, name, category, specs, price, currency, store, rating, reviews, icon, url, keywords
    )
    VALUES (
      @external_id, @name, @category, @specs, @price, @currency, @store, @rating, @reviews, @icon, @url, @keywords
    )
    ON CONFLICT(external_id) DO UPDATE SET
      name=excluded.name,
      category=excluded.category,
      specs=excluded.specs,
      price=excluded.price,
      currency=excluded.currency,
      store=excluded.store,
      rating=excluded.rating,
      reviews=excluded.reviews,
      icon=excluded.icon,
      url=excluded.url,
      keywords=excluded.keywords,
      updated_at=CURRENT_TIMESTAMP
  `);

  const transaction = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });

  transaction(seedProducts);
  console.log(`Database ready at ${dbPath}`);
}

if (process.argv.includes("--init")) {
  initDb();
}

module.exports = { db, initDb };
