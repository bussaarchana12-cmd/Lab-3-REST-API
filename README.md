# Lab 3 – REST API Development

## Book Management REST API

This project is a Book Management REST API developed using Node.js, Express.js, and SQLite as part of Backend Development Fundamentals – Lab 3.

The API allows users to perform CRUD operations on book records. It also supports searching, sorting, pagination, price filtering, and request validation.

## Technologies Used

- Node.js
- Express.js
- SQLite
- JavaScript

## Project Features

- Retrieve all books.
- Retrieve a specific book using its ID.
- Add new book records.
- Update existing book details.
- Delete book records.
- Search books by title or author.
- Sort books by ID, title, author, price, or pages.
- Implement pagination using limit and offset.
- Filter books using minimum and maximum price.
- Validate request data.
- Handle errors and HTTP status codes.

## API Endpoints

| HTTP Method | Endpoint | Description |
|---|---|---|
| GET | `/books` | Retrieve all books |
| GET | `/books/:bookId` | Retrieve a book by ID |
| POST | `/books` | Add a new book |
| PUT | `/books/:bookId` | Update book details |
| DELETE | `/books/:bookId` | Delete a book |

## Query Parameters

### 1. Search Books

`GET /books?search_q=Harry`

Search books by title or author.

### 2. Sort Books

`GET /books?order_by=title&order=ASC`

Sort books in ascending or descending order.

### 3. Pagination

`GET /books?limit=5&offset=0`

Retrieve books using limit and offset.

### 4. Filter Books by Price

`GET /books?min_price=100&max_price=500`

Retrieve books within the specified price range.

## Sample JSON Request

### Add a New Book – POST

```json
{
  "title": "The Alchemist",
  "author": "Paulo Coelho",
  "price": 350,
  "pages": 208
}
```

## HTTP Status Codes

| Status Code | Description |
|---|---|
| 200 | Request successful |
| 201 | Book created successfully |
| 400 | Invalid request |
| 404 | Book or route not found |
| 500 | Internal server error |

## Live Project

**Render Deployment:**

https://lab-3-rest-api-3.onrender.com

The deployed application provides the API documentation homepage and book management endpoints.

## GitHub Repository

https://github.com/bussaarchana12-cmd/Lab-3-REST-API

## API Testing

The API endpoints are tested using Postman.

The following HTTP methods are tested:

- GET – Retrieve book records.
- POST – Add a new book.
- PUT – Update an existing book.
- DELETE – Delete a book.

## Learning Outcomes

- Understanding REST API principles and architecture.
- Implementing CRUD operations using Express.js.
- Connecting an API with an SQLite database.
- Working with HTTP methods and query parameters.
- Implementing request validation.
- Handling errors and HTTP status codes.
- Testing API endpoints using Postman.
- Deploying a REST API application using Render.

---

**Course:** Backend Development Fundamentals  
**Lab:** Lab 3 – REST API Development  
**Project:** Book Management REST API