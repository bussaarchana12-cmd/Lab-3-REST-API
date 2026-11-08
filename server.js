
const express = require("express");
const db = require("./db");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// HOME PAGE - API DOCUMENTATION
app.get("/", (request, response) => {
    response.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Lab 3 - REST API</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 30px;
                    background: #f4f6fa;
                    color: #222;
                }
                h1 { color: #243b64; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                }
                th, td {
                    padding: 13px;
                    border: 1px solid #ddd;
                    text-align: left;
                }
                th {
                    background: #243b64;
                    color: white;
                }
                a { color: #1769aa; }
                .method { font-weight: bold; }
                footer { margin-top: 25px; color: #555; }
            </style>
        </head>
        <body>
            <h1>Lab 3 - REST API</h1>
            <h2>Book Management API</h2>
            <p>Welcome! Below are the available API endpoints.</p>

            <table>
                <tr>
                    <th>HTTP Method</th>
                    <th>Endpoint</th>
                    <th>Description</th>
                </tr>
                <tr>
                    <td class="method">GET</td>
                    <td><a href="/books">/books</a></td>
                    <td>Get All Books</td>
                </tr>
                <tr>
                    <td class="method">GET</td>
                    <td><a href="/books/1">/books/1</a></td>
                    <td>Get Book by ID</td>
                </tr>
                <tr>
                    <td class="method">GET</td>
                    <td><a href="/books?search_q=Harry">/books?search_q=Harry</a></td>
                    <td>Search Books</td>
                </tr>
                <tr>
                    <td class="method">GET</td>
                    <td><a href="/books?order_by=title&order=ASC">/books?order_by=title&order=ASC</a></td>
                    <td>Sort Books</td>
                </tr>
                <tr>
                    <td class="method">GET</td>
                    <td><a href="/books?limit=5&offset=0">/books?limit=5&offset=0</a></td>
                    <td>Pagination</td>
                </tr>
                <tr>
                    <td class="method">GET</td>
                    <td><a href="/books?min_price=100&max_price=500">/books?min_price=100&max_price=500</a></td>
                    <td>Filter by Price</td>
                </tr>
                <tr>
                    <td class="method">POST</td>
                    <td>/books</td>
                    <td>Add New Book</td>
                </tr>
                <tr>
                    <td class="method">PUT</td>
                    <td>/books/1</td>
                    <td>Update Book</td>
                </tr>
                <tr>
                    <td class="method">DELETE</td>
                    <td>/books/1</td>
                    <td>Delete Book</td>
                </tr>
            </table>

            <h3>Technologies Used</h3>
            <p>Node.js | Express.js | SQLite | JavaScript</p>

            <footer>
                <p>Backend Development Fundamentals - Lab 3</p>
            </footer>
        </body>
        </html>
    `);
});

// GET ALL BOOKS - SEARCH, SORT, PAGINATION, PRICE FILTER
app.get("/books", async (request, response) => {
    try {
        const database = await db;

        const {
            search_q = "",
            order_by = "id",
            order = "ASC",
            limit = "10",
            offset = "0",
            min_price,
            max_price
        } = request.query;

        const allowedColumns = ["id", "title", "author", "price", "pages"];

        if (!allowedColumns.includes(order_by)) {
            return response.status(400).json({
                error: "Invalid sorting column"
            });
        }

        const sortOrder = order.toUpperCase();

        if (!["ASC", "DESC"].includes(sortOrder)) {
            return response.status(400).json({
                error: "Order must be ASC or DESC"
            });
        }

        const pageLimit = Number(limit);
        const pageOffset = Number(offset);

        if (
            !/^\d+$/.test(limit) ||
            !/^\d+$/.test(offset) ||
            !Number.isSafeInteger(pageLimit) ||
            !Number.isSafeInteger(pageOffset) ||
            pageLimit < 1 ||
            pageLimit > 100
        ) {
            return response.status(400).json({
                error: "Invalid limit or offset"
            });
        }

        const minPrice =
            min_price === undefined ? undefined : Number(min_price);

        const maxPrice =
            max_price === undefined ? undefined : Number(max_price);

        if (
            (min_price !== undefined &&
                (!Number.isFinite(minPrice) || minPrice < 0)) ||
            (max_price !== undefined &&
                (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
            (minPrice !== undefined &&
                maxPrice !== undefined &&
                minPrice > maxPrice)
        ) {
            return response.status(400).json({
                error: "Invalid price range"
            });
        }

        let query = "SELECT * FROM book WHERE 1=1";
        const params = [];

        if (search_q.trim()) {
            query += " AND (title LIKE ? OR author LIKE ?)";
            params.push(
                `%${search_q.trim()}%`,
                `%${search_q.trim()}%`
            );
        }

        if (minPrice !== undefined) {
            query += " AND price >= ?";
            params.push(minPrice);
        }

        if (maxPrice !== undefined) {
            query += " AND price <= ?";
            params.push(maxPrice);
        }

        query += ` ORDER BY ${order_by} ${sortOrder}`;
        query += " LIMIT ? OFFSET ?";
        params.push(pageLimit, pageOffset);

        const books = await database.all(query, params);
        response.status(200).json(books);

    } catch (error) {
        console.error(error);
        response.status(500).json({
            error: "Internal server error"
        });
    }
});

// GET ONE BOOK BY ID
app.get("/books/:bookId", async (request, response) => {
    try {
        const bookId = Number(request.params.bookId);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return response.status(400).json({
                error: "Invalid book ID"
            });
        }

        const database = await db;
        const book = await database.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        if (!book) {
            return response.status(404).json({
                error: "Book not found"
            });
        }

        response.status(200).json(book);

    } catch (error) {
        console.error(error);
        response.status(500).json({
            error: "Internal server error"
        });
    }
});

// POST - ADD NEW BOOK
app.post("/books", async (request, response) => {
    try {
        const { title, author, price, pages } = request.body;

        if (
            typeof title !== "string" || !title.trim() ||
            typeof author !== "string" || !author.trim() ||
            typeof price !== "number" || !Number.isFinite(price) || price < 0 ||
            !Number.isInteger(pages) || pages <= 0
        ) {
            return response.status(400).json({
                error: "Invalid book details"
            });
        }

        const database = await db;

        await database.run(
            `INSERT INTO book (title, author, price, pages)
             VALUES (?, ?, ?, ?)`,
            [title.trim(), author.trim(), price, pages]
        );

        const result = await database.get(
            "SELECT * FROM book WHERE id = last_insert_rowid()"
        );

        response.status(201).json(result);

    } catch (error) {
        console.error(error);
        response.status(500).json({
            error: "Internal server error"
        });
    }
});

// PUT - UPDATE BOOK
app.put("/books/:bookId", async (request, response) => {
    try {
        const bookId = Number(request.params.bookId);
        const { title, author, price, pages } = request.body;

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return response.status(400).json({
                error: "Invalid book ID"
            });
        }

        if (
            typeof title !== "string" || !title.trim() ||
            typeof author !== "string" || !author.trim() ||
            typeof price !== "number" || !Number.isFinite(price) || price < 0 ||
            !Number.isInteger(pages) || pages <= 0
        ) {
            return response.status(400).json({
                error: "Invalid book details"
            });
        }

        const database = await db;

        const existingBook = await database.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        if (!existingBook) {
            return response.status(404).json({
                error: "Book not found"
            });
        }

        await database.run(
            `UPDATE book
             SET title = ?, author = ?, price = ?, pages = ?
             WHERE id = ?`,
            [title.trim(), author.trim(), price, pages, bookId]
        );

        const updatedBook = await database.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        response.status(200).json(updatedBook);

    } catch (error) {
        console.error(error);
        response.status(500).json({
            error: "Internal server error"
        });
    }
});

// DELETE - DELETE BOOK
app.delete("/books/:bookId", async (request, response) => {
    try {
        const bookId = Number(request.params.bookId);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return response.status(400).json({
                error: "Invalid book ID"
            });
        }

        const database = await db;

        const book = await database.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        if (!book) {
            return response.status(404).json({
                error: "Book not found"
            });
        }

        await database.run(
            "DELETE FROM book WHERE id = ?",
            [bookId]
        );

        response.status(200).json({
            message: "Book deleted successfully"
        });

    } catch (error) {
        console.error(error);
        response.status(500).json({
            error: "Internal server error"
        });
    }
});

// HANDLE UNKNOWN ROUTES - KEEP THIS LAST
app.use((request, response) => {
    response.status(404).json({
        error: "Route not found"
    });
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
