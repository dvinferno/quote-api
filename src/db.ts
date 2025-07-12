import mysql from "mysql2/promise";

export const pool = mysql.createPool({
    host: Bun.env.DB_HOST,
    user: Bun.env.DB_USER,
    password: Bun.env.DB_PASSWORD,
    database: Bun.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});