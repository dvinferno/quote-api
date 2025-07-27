import express from "express";
import { pool } from "../db";
import { cache } from "../middleware/cache";

const router = express.Router();

// GET /quotes?page=1&limit=10
router.get("/", cache(3600), async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
        const [quotes] = await pool.query(
            "SELECT * FROM quotes LIMIT ? OFFSET ?",
            [limit, offset]
        );

        const [totalResult] = await pool.query(
            "SELECT COUNT(*) as count FROM quotes"
        );

        const total = Array.isArray(totalResult) ? (totalResult[0] as any).count : 0;

        res.json({
            data: quotes,
            page,
            limit,
            total,
        });
    } catch (err) {
        console.error("Error fetching quotes:", err);
        res.status(500).json({ error: "Failed to fetch quotes" });
    }
});

// GET /quotes/random
// @ts-ignore
router.get("/random", cache(10), async (_, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM quotes ORDER BY RAND() LIMIT 1"
        );

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(404).json({ error: "No quotes found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching random quote:", err);
        res.status(500).json({ error: "Failed to fetch random quote" });
    }
});

// GET /quotes/search?q=keyword
// @ts-ignore
router.get("/search", cache(600), async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: "Missing query" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const likeQuery = `%${q.toLowerCase()}%`;

    try {
        // Get matching quotes
        const [quotes] = await pool.query(
            `SELECT * FROM quotes
       WHERE LOWER(quote) LIKE ?
       LIMIT ? OFFSET ?`,
            [likeQuery, limit, offset]
        );

        // Get total count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) AS count
       FROM quotes
       WHERE LOWER(quote) LIKE ?`,
            [likeQuery]
        );

        const total = Array.isArray(countResult) ? (countResult[0] as any).count : 0;

        res.json({
            data: quotes,
            page,
            limit,
            total,
        });
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Failed to search quotes" });
    }
});

// GET /quotes/length?min=50&max=150&page=1&limit=10
router.get("/length", cache(600), async (req, res) => {
    const min = parseInt(req.query.min as string) || 0;
    const max = parseInt(req.query.max as string) || 10000;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
        // Get quotes within length range
        const [quotes] = await pool.query(
            `SELECT * FROM quotes
       WHERE CHAR_LENGTH(quote) BETWEEN ? AND ?
       ORDER BY RAND()
       LIMIT ? OFFSET ?`,
            [min, max, limit, offset]
        );

        // Get total count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) AS count
       FROM quotes
       WHERE CHAR_LENGTH(quote) BETWEEN ? AND ?`,
            [min, max]
        );

        const total = Array.isArray(countResult) ? (countResult[0] as any).count : 0;

        res.json({
            data: quotes,
            page,
            limit,
            total,
        });
    } catch (err) {
        console.error("Length filter error:", err);
        res.status(500).json({ error: "Failed to filter quotes by length" });
    }
});

// GET /quotes/category/:tag?page=1&limit=10
router.get("/category/:tag", cache(900), async (req, res) => {
    const tag = (req.params.tag || "").toLowerCase();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const likeQuery = `%${tag}%`;

    try {
        // Get paginated quotes
        const [quotes] = await pool.query(
            `SELECT * FROM quotes
       WHERE LOWER(category) LIKE ?
       ORDER BY RAND()
       LIMIT ? OFFSET ?`,
            [likeQuery, limit, offset]
        );

        // Get total matching count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) AS count
       FROM quotes
       WHERE LOWER(category) LIKE ?`,
            [likeQuery]
        );

        const total = Array.isArray(countResult) ? (countResult[0] as any).count : 0;

        res.json({
            data: quotes,
            page,
            limit,
            total,
        });
    } catch (err) {
        console.error("Category filter error:", err);
        res.status(500).json({ error: "Failed to fetch quotes by category" });
    }
});

// GET /quotes/stats
router.get("/stats", cache(300), async (_, res) => {
    try {
        const [totalRows] = await pool.query("SELECT COUNT(*) AS count FROM quotes");
        const total = Array.isArray(totalRows) && totalRows.length > 0 ? (totalRows[0] as any).count : 0;

        const [authorRows] = await pool.query("SELECT COUNT(DISTINCT author) AS count FROM quotes");
        const authors = Array.isArray(authorRows) && authorRows.length > 0 ? (authorRows[0] as any).count : 0;

        const [categoryRows] = await pool.query("SELECT category FROM quotes");

        const uniqueCategories = new Set<string>();
        for (const row of categoryRows as { category?: string }[]) {
            const raw = row.category;
            if (!raw) continue;

            raw.split(",").forEach(tag => {
                uniqueCategories.add(tag.trim().toLowerCase());
            });
        }

        res.json({
            total,
            authors,
            categories: uniqueCategories.size,
        });
    } catch (err) {
        console.error("Stats error:", err);
        res.status(500).json({ error: "Failed to calculate stats" });
    }
});

// GET /quotes/:id
// @ts-ignore
router.get("/:id", cache(3600), async (req, res) => {
    // @ts-ignore
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid quote ID" });

    try {
        const [rows] = await pool.query("SELECT * FROM quotes WHERE id = ?", [id]);
        const quote = Array.isArray(rows) && rows[0];

        if (!quote) {
            return res.status(404).json({ error: "Quote not found" });
        }

        res.json(quote);
    } catch (err) {
        console.error("Fetch by ID error:", err);
        res.status(500).json({ error: "Failed to fetch quote" });
    }
});

export default router;