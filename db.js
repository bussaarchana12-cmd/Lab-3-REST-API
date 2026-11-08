const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "books.db");

const db = open({
    filename: dbPath,
    driver: sqlite3.Database
});

module.exports = db;