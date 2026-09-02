# Authentication API

A Node.js REST API for user registration, login, and logout. The API uses Express for HTTP routing, MongoDB with Mongoose for persistence, bcryptjs for password hashing, and JSON Web Tokens (JWTs) stored in HTTP-only cookies for authentication.

## Features

- Register a user with a name, email address, and password.
- Validate email format before creating an account.
- Prevent duplicate email addresses.
- Hash passwords with bcrypt before storing them.
- Authenticate users by name and password.
- Issue a seven-day JWT in an HTTP-only `jwt` cookie.
- Clear the authentication cookie during logout.
- Return the authenticated user's ID, name, and email without returning the password.

## Technology Stack

- Node.js with ECMAScript modules
- Express 5
- MongoDB and Mongoose
- JSON Web Token (`jsonwebtoken`)
- `bcryptjs`
- `cookie-parser`
- `dotenv`
- `nodemon` for development

## Project Structure

```text
Authentication API/
├── config/
│   ├── database.js              # MongoDB connection
│   └── utils/
│       └── generateToken.js     # JWT creation and cookie configuration
├── controllers/
│   └── auth.controllers.js      # Signup, login, and logout handlers
├── model/
│   └── user.model.js            # Mongoose user schema
├── routes/
│   └── auth.routes.js            # Authentication route definitions
├── .env                         # Local environment variables; do not commit
├── package.json
├── package-lock.json
├── server.js                    # Application entry point
└── ReadMe.md
```

## Requirements

- Node.js 18 or newer
- npm
- A running MongoDB instance or MongoDB Atlas connection string

## Installation

1. Clone or open the project.
2. Install the dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```env
MONGO_URL=mongodb://localhost:27017/Authentication-API
PORT=3000
JWT_SECRET=replace-this-with-a-long-random-secret
NODE_ENV=development
```

Use a strong, unique value for `JWT_SECRET`. Never commit `.env` or expose the database connection string and JWT secret in source control.

## Running the API

Start the development server with automatic restart:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

The port is controlled by `PORT`. When the server starts, it connects to MongoDB using `MONGO_URL`.

## API Endpoints

The base path for authentication endpoints is `/api/v1/auth`.

### Sign up

Creates a new user, hashes the password, issues a JWT cookie, and returns the new user's public details.

```http
POST /api/v1/auth/signup
Content-Type: application/json
```

Request body:

```json
{
	"name": "Kofi Kaká",
	"email": "kofi@example.com",
	"password": "123456"
}
```

Successful response: `201 Created`

```json
{
	"_id": "507f1f77bcf86cd799439011",
	"name": "Kofi Kaká",
	"email": "kofi@example.com"
}
```

Possible validation responses:

- `400 Bad Request` when a required field is missing.
- `400 Bad Request` when the email format is invalid.
- `400 Bad Request` when the email is already registered.
- `400 Bad Request` when the password is shorter than six characters.

### Log in

Finds a user by name, verifies the password, issues a JWT cookie, and returns the user's public details.

```http
POST /api/v1/auth/login
Content-Type: application/json
```

Request body:

```json
{
	"name": "Kofi Kaká",
	"password": "123456"
}
```

Successful response: `200 OK`

```json
{
	"_id": "507f1f77bcf86cd799439011",
	"name": "Kofi Kaká",
	"email": "kofi@example.com"
}
```

The response also sets the `jwt` cookie. In development, the cookie can be sent over local HTTP. In production, set `NODE_ENV=production` so the cookie is marked secure and should only be sent over HTTPS.

Possible validation response:

```json
{
	"message": "Invalid username or password"
}
```

Status: `400 Bad Request`.

### Log out

Clears the `jwt` authentication cookie.

```http
POST /api/v1/auth/logout
```

Successful response: `200 OK`

```json
{
	"message": "Logged out successfully"
}
```

## JWT Behavior

JWTs are generated in `config/utils/generateToken.js` with the following behavior:

- The payload contains the user's MongoDB ID as `userId`.
- The token is signed with `JWT_SECRET`.
- The token expires after seven days.
- The token is stored in an HTTP-only cookie named `jwt`.
- The cookie uses `sameSite: "strict"`.
- The cookie is secure in production.

Clients such as Postman must preserve cookies between requests if they need to test authenticated routes later. Browser JavaScript cannot read the cookie because it is HTTP-only.

## Testing with Postman

1. Start the API with `npm run dev`.
2. Send a `POST` request to `http://localhost:3000/api/v1/auth/signup` with a JSON body containing `name`, `email`, and `password`.
3. Send a `POST` request to `http://localhost:3000/api/v1/auth/login` with the registered `name` and `password`.
4. Confirm the response contains `_id`, `name`, and `email`.
5. Open Postman's cookie manager and confirm a `jwt` cookie exists for `localhost`.
6. Send `POST http://localhost:3000/api/v1/auth/logout` to clear the cookie.

## Error Handling

Unexpected controller errors are returned in this general format:

```json
{
	"error": "Error message"
}
```

The current application does not yet include a global error-handling middleware, request schema validation library, protected user routes, or automated tests.

## Security Notes

- Keep `.env` out of version control.
- Rotate any database password or JWT secret that has been exposed outside the local environment.
- Use HTTPS in production because secure cookies should not be sent over plain HTTP.
- Use a long random JWT secret.
- Do not return password hashes in API responses.
- Add rate limiting and account lockout protections before exposing login publicly.
- Add authentication middleware before creating protected routes.

## Available npm Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the server with Nodemon |

