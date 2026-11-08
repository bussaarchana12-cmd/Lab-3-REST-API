
const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// GET all books with search, sorting, pagination and price filters
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

        // Validate sorting column
        const allowedColumns = [
            "id", "title", "author", "price", "pages"
        ];

        if (!allowedColumns.includes(order_by)) {
            return response.status(400).json({
                error: "Invalid sorting column"
            });
        }

        // Validate sorting order
        const sortOrder = order.toUpperCase();

        if (!["ASC", "DESC"].includes(sortOrder)) {
            return response.status(400).json({
                error: "Order must be ASC or DESC"
            });
        }

        // Validate pagination
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

        // Validate price filters
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

        // Build SQL query
        let query = "SELECT * FROM book WHERE 1=1";
        const params = [];

        // Search by title or author
        if (search_q.trim()) {
            query += " AND (title LIKE ? OR author LIKE ?)";
            params.push(
                `%${search_q.trim()}%`,
                `%${search_q.trim()}%`
            );
        }

        // Minimum price
        if (minPrice !== undefined) {
            query += " AND price >= ?";
            params.push(minPrice);
        }

        // Maximum price
        if (maxPrice !== undefined) {
            query += " AND price <= ?";
            params.push(maxPrice);
        }

        // Sorting
        query += ` ORDER BY ${order_by} ${sortOrder}`;

        // Pagination
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


// GET one book by ID
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


// POST - Add a new book
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


// PUT - Update an existing book
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


// DELETE - Delete a book
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


// Handle unknown routes
app.use((request, response) => {
    response.status(404).json({
        error: "Route not found"
    });
});

// Home page - API Documentation
app.get("/", (request, response) => {
    response.send(`
        <html>
        <head>
            <title>Lab 3 - REST API</title>
            <style>
                body {
                    font-family: Arial;
                    margin: 40px;
                    background: #f4f4f4;
                }
                h1 { color: #243b64; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                }
                th, td {
                    padding: 12px;
                    border: 1px solid #ddd;
                    text-align: left;
                }
                th { background: #243b64; color: white; }
            </style>
        </head>
        <body>
            <h1>Lab 3 - REST API</h1>
            <h2>Book Management API Endpoints</h2>
            <table>
                <tr><th>Method</th><th>Path</th><th>Description</th></tr>
                <tr><td>GET</td><td>/books</td><td>Get All Books</td></tr>
                <tr><td>GET</td><td>/books/1</td><td>Get Book by ID</td></tr>
                <tr><td>GET</td><td>/books?search=Harry</td><td>Search Books</td></tr>
                <tr><td>GET</td><td>/books?sort=title&order=ASC</td><td>Sort Books</td></tr>
                <tr><td>POST</td><td>/books</td><td>Add New Book</td></tr>
                <tr><td>PUT</td><td>/books/1</td><td>Update Book</td></tr>
                <tr><td>DELETE</td><td>/books/1</td><td>Delete Book</td></tr>
            </table>
            <h3>Technology Used</h3>
            <p>Node.js | Express.js | SQLite</p>
        </body>
        </html>
    `);
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
