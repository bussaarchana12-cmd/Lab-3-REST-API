
const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// GET all books with search and sorting
app.get("/books", async (request, response) => {
    try {
        const database = await db;

        const { search = "", sort = "id" } = request.query;

        const allowedSort = [
            "id",
            "title",
            "author",
            "price",
            "pages"
        ];

        if (!allowedSort.includes(sort)) {
            return response.status(400).json({
                error: "Invalid sort field"
            });
        }

        const books = await database.all(
            `SELECT * FROM book
             WHERE title LIKE ?
             ORDER BY ${sort} ASC`,
            [`%${search}%`]
        );

        response.status(200).json(books);

    } catch (error) {
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
            typeof price !== "number" || price < 0 ||
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
            typeof price !== "number" || price < 0 ||
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
