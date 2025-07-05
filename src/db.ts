import { Database } from "bun:sqlite";

const db = new Database("quotes.db");

export default db;