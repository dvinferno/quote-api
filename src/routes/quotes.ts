import express from "express";
import db from "../db";

const router = express.Router();

// GET /quotes?page=1&limit=10
router.get("/", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const quotes = db
        .query("SELECT * FROM quotes LIMIT ? OFFSET ?")
        .all(limit, offset);

    res.json(quotes);
});

// GET /quotes/random
router.get("/random", (_, res) => {
    const quote = db.query("SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1").get();
    res.json(quote);
});

// GET /quotes/search?q=keyword
router.get("/search", (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: "Missing query" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const likeQuery = `%${q.toLowerCase()}%`;

    // Paginated results
    const quotes = db.query(
        `SELECT * FROM quotes
     WHERE LOWER(quote) LIKE ?
     LIMIT ? OFFSET ?`
    ).all(likeQuery, limit, offset);

    // Total count
    const total = db.query(
        `SELECT COUNT(*) AS count
     FROM quotes
     WHERE LOWER(quote) LIKE ?`
    ).get(likeQuery) as { count: number };

    res.json({
        data: quotes,
        page,
        limit,
        total: total.count,
    });
});

// GET /quotes/length?min=50&max=150&page=1&limit=10
router.get("/length", (req, res) => {
  const min = parseInt(req.query.min as string) || 0;
  const max = parseInt(req.query.max as string) || 10000;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const quotes = db.query(
    `SELECT * FROM quotes
     WHERE LENGTH(quote) BETWEEN ? AND ?
     ORDER BY RANDOM()
     LIMIT ? OFFSET ?`
  ).all(min, max, limit, offset);

  const total = db.query(
    `SELECT COUNT(*) AS count
     FROM quotes
     WHERE LENGTH(quote) BETWEEN ? AND ?`
  ).get(min, max) as { count: number };

  res.json({
    data: quotes,
    page,
    limit,
    total: total.count,
  });
});

// GET /quotes/category/:tag?page=1&limit=10
router.get("/category/:tag", (req, res) => {
    const tag = req.params.tag.toLowerCase();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get paginated quotes
    const quotes = db.query(
        "SELECT * FROM quotes WHERE LOWER(category) LIKE ? LIMIT ? OFFSET ?"
    ).all(`%${tag}%`, limit, offset);

    // Get total matching count
    const total = db.query(
        "SELECT COUNT(*) AS count FROM quotes WHERE LOWER(category) LIKE ?"
    ).get(`%${tag}%`) as { count: number };

    res.json({
        data: quotes,
        page,
        limit,
        total: total.count,
    });
});

// GET /quotes/stats
router.get("/stats", (_, res) => {
    try {
        const total = db.query("SELECT COUNT(*) AS count FROM quotes").get() as { count: number };
        const authors = db.query("SELECT COUNT(DISTINCT author) AS count FROM quotes").get() as { count: number };
        const categories = db.query("SELECT category FROM quotes").all();

        const uniqueCategories = new Set<string>();
        for (const row of categories) {
            const raw = (row as { category?: string }).category;
            if (!raw) continue;

            raw.split(",").forEach(tag => {
                uniqueCategories.add(tag.trim().toLowerCase());
            });
        }

        res.json({
            total: total.count,
            authors: authors.count,
            categories: uniqueCategories.size,
        });
    } catch (err) {
        console.error("Stats error:", err);
        res.status(500).json({ error: "Failed to calculate stats" });
    }
});

// GET /quotes/:id
router.get("/:id", (req, res) => {
    const quote = db.query("SELECT * FROM quotes WHERE id = ?").get(req.params.id);
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    res.json(quote);
});

export default router;