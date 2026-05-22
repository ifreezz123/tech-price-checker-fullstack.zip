const { db } = require("./db");

function toPositiveInt(value, fallback, max = 100) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(number, max);
}

function normalizeQuery(query) {
  return String(query || "")
    .trim()
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ");
}

function buildFtsQuery(query) {
  const words = normalizeQuery(query).split(" ").filter(Boolean);
  return words.map(word => `${word}*`).join(" ");
}

function getSortSql(sort) {
  switch (sort) {
    case "price-low":
      return "price ASC";
    case "price-high":
      return "price DESC";
    case "rating":
      return "rating DESC, reviews DESC";
    case "newest":
      return "updated_at DESC";
    default:
      return "rank ASC, price ASC";
  }
}

function searchProducts(params = {}) {
  const q = normalizeQuery(params.q);
  const category = params.category && params.category !== "all" ? String(params.category) : null;
  const sort = String(params.sort || "relevance");
  const page = toPositiveInt(params.page, 1, 10000);
  const limit = toPositiveInt(params.limit, 10, 50);
  const offset = (page - 1) * limit;

  const replacements = {
    category,
    limit,
    offset
  };

  let baseSql;
  let countSql;
  let where = [];
  let join = "";
  let rankSelect = "0 AS rank";

  if (q) {
    join = "JOIN products_fts ON products_fts.rowid = products.id";
    where.push("products_fts MATCH @fts");
    replacements.fts = buildFtsQuery(q);
    rankSelect = "bm25(products_fts) AS rank";
  }

  if (category) {
    where.push("products.category = @category");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  baseSql = `
    SELECT
      products.id,
      products.external_id,
      products.name,
      products.category,
      products.specs,
      products.price,
      products.currency,
      products.store,
      products.rating,
      products.reviews,
      products.icon,
      products.url,
      products.updated_at,
      ${rankSelect}
    FROM products
    ${join}
    ${whereSql}
    ORDER BY ${getSortSql(sort)}
    LIMIT @limit OFFSET @offset
  `;

  countSql = `
    SELECT COUNT(*) AS total
    FROM products
    ${join}
    ${whereSql}
  `;

  const rows = db.prepare(baseSql).all(replacements);
  const total = db.prepare(countSql).get(replacements).total;

  return {
    items: rows,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

function getCategories() {
  return db.prepare(`
    SELECT category, COUNT(*) AS count
    FROM products
    GROUP BY category
    ORDER BY category ASC
  `).all();
}

module.exports = { searchProducts, getCategories };
