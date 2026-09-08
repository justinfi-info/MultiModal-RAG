import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import router from "./bill.route/billing.route.js"

// Load environment variables from this service's .env file.
dotenv.config()

// The port should come from the standard PORT variable.
const port = process.env.PORT
const app = express()

app.use(express.json())

app.use("/",router)

app.get("/", (req, res) => {
    res.json({ message: "hello from billing" });
});

app.listen(port, () => {
    console.log(`billing started at ${port}`);
    // Ensure the database connection is established before handling
    // requests. If connectDB throws, the server will still start but
    // subsequent requests will fail until the DB is reachable.
    connectDB();
});
