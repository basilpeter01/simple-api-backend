# IoT Parts API & Postman Testbed

A lightweight Express REST API with an in-memory datastore and Bearer token authentication. I built this specifically as a local target to design, run, and practice API testing with Postman.

## Features

- **Auth Simulation:** Bearer token generation via `/api-clients` to protect order endpoints.
- **RESTful Endpoints:** Covers standard HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`) with common status codes (`201`, `204`, `400`, `401`, `404`, `409`).
- **Testing Environment:** Provides a clean local backend for practicing Postman test scripts, environment variable chaining, and JSON schema validation.

## API Endpoints

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | No | Root welcome message. |
| `GET` | `/status` | No | Health check. |
| `POST` | `/api-clients` | No | Registers client and returns access token. |
| `GET` | `/parts` | No | Fetches parts (supports `type` & `limit` query params). |
| `GET` | `/parts/:partId` | No | Fetches a single part by ID. |
| `POST` | `/orders` | Yes | Places an order for a part. |
| `GET` | `/orders` | Yes | Retrieves orders placed by the token holder. |
| `GET` | `/orders/:orderId`| Yes | Retrieves a specific order. |
| `PATCH`| `/orders/:orderId`| Yes | Updates customer details on an order. |
| `DELETE`| `/orders/:orderId`| Yes | Cancels and removes an order. |

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the server:**
   ```bash
   npm start
   ```
   The API will run on `http://localhost:3000`.

## Testing with Postman

This project is intended to be used with Postman for API testing practice:
1. Send a `POST` request to `/api-clients` with a JSON body (`clientName`, `clientEmail`) to receive an `accessToken`.
2. Configure Postman to use this token in the Authorization tab (Bearer Token) for all `/orders` routes.
3. Write test scripts in the Postman "Tests" tab to assert status codes, verify response data, and practice API chaining (e.g., automatically saving the access token to an environment variable).
