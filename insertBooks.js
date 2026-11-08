const db = require("./db");

const insertBooks = async () => {
    const database = await db;

    await database.run(`
        INSERT INTO book (title, author, price, pages)
        VALUES
        ('Harry Potter', 'J.K. Rowling', 500, 350),
        ('The Hobbit', 'J.R.R. Tolkien', 400, 310),
        ('Wings of Fire', 'A.P.J. Abdul Kalam', 250, 180),
        ('The Alchemist', 'Paulo Coelho', 300, 200),
        ('Atomic Habits', 'James Clear', 450, 320),
        ('Rich Dad Poor Dad', 'Robert Kiyosaki', 350, 250),
        ('The Power of Now', 'Eckhart Tolle', 400, 230),
        ('Think and Grow Rich', 'Napoleon Hill', 300, 280)
    `);

    console.log("Books inserted successfully");
};

insertBooks();