require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cron = require("node-cron");

const { initDb } = require("./db");
const { searchProducts, getCategories } = require("./search");
const TTLCache = require("./cache");
const { refreshPrices } = require("./priceRefresher");

const app = express();
const port = Number(process.env.PORT || 3000);
const cacheTtl = Number(process.env.CACHE_TTL_SECONDS || 60);
const cache = new TTLCache(cacheTtl);

initDb();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api/categories", (req, res, next) => {
  try {
    const cached = cache.get("categories");
    if (cached) return res.json({ ...cached, cached: true });

    const categories = getCategories();
    const payload = { categories };
    cache.set("categories", payload, cacheTtl);

    res.json({ ...payload, cached: false });
  } catch (error) {
    next(error);
  }
});

app.get("/api/products", (req, res, next) => {
  try {
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const result = searchProducts(req.query);
    cache.set(cacheKey, result, cacheTtl);

    res.json({ ...result, cached: false });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/refresh-prices", async (req, res, next) => {
  try {
    const result = await refreshPrices();
    cache.clear();
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

const cronExpression = process.env.PRICE_REFRESH_CRON || "*/30 * * * *";
cron.schedule(cronExpression, async () => {
  try {
    await refreshPrices();
    cache.clear();
    console.log("Scheduled price refresh completed.");
  } catch (error) {
    console.error("Scheduled price refresh failed:", error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    error: "Server error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong." : error.message
  });
});

app.listen(port, () => {
  console.log(`Tech Price Checker running at http://localhost:${port}`);
});
