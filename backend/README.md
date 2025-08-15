# Equipment Reservation System - Backend

This directory contains the Node.js, Express, and PostgreSQL backend server for the Equipment Reservation System.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Setup Environment Variables:**
    Create a file named `.env` in this directory by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, edit the `.env` file with your actual database connection details and your Google Gemini API Key.
    ```
    # Your PostgreSQL connection string
    DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>"

    # Your Google Gemini API Key
    API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
    *   Replace `<USER>`, `<PASSWORD>`, `<HOST>`, `<PORT>`, and `<DATABASE>` with your PostgreSQL credentials.
    *   For a local setup, `<HOST>` is typically `localhost` and `<PORT>` is `5432`.
    *   The `<DATABASE>` should be the one you created, e.g., `equipment_reservation_system`.

3.  **Database Schema:**
    Before starting the server, you need to create the necessary tables in your PostgreSQL database. Connect to your database using a tool like `pgAdmin` or `DBeaver` and run the SQL commands found in `backend/schema.sql`.

## Running the Server

To start the backend server in development mode (with auto-reloading on file changes), run:

```bash
npm run dev
```

The server will start on `http://localhost:4000` by default. The frontend application is configured to communicate with this address.
