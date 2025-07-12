import express from "express";
import quotesRouter from "./routes/quotes";

const app = express();
app.use(express.json());

app.use("/quotes", quotesRouter);

app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        console.log(`${req.method} ${req.url} - ${Date.now() - start}ms`);
    });
    next();
});

app.get("/", (_, res) => {
    res.send("Welcome to the Quote API!");
});

const PORT = Bun.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));