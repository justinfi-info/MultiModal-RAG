import express from "express"
import dotenv from "dotenv"
import { MulterError } from "multer"
import connectDB from "./config/db.js"
import agentRouter from "./routes/agent.route.js"
import { SIZE_ERROR_MESSAGE } from "./config/fileValidation.js"

// Load environment variables. In development we use the local .env file.
dotenv.config()

// The port should come from the standard PORT variable.
const port = process.env.PORT || 8003
const app = express()

app.use(express.json())
app.use("/", agentRouter)

// Surface upload validation failures as clean JSON with the reason.
// Must be registered before the generic handler below so these cases
// aren't swallowed by it.
app.use((err, req, res, next) => {
    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: SIZE_ERROR_MESSAGE })
    }
    if (err.status && err.data) {
        return res.status(err.status).json(err.data)
    }
    if (err.status && err.message) {
        return res.status(err.status).json({ message: err.message })
    }
    next(err)
})

app.get("/", (req, res) => {
    res.json({ message: "hello from agent" });
});

app.use((err, req, res, next)=> {
    console.error(err)
    return res.status(500).json({message:`agent error ${err.message || err}`})
})

app.listen(port, () => {
    console.log(`agent started at ${port}`);
    // Ensure the database connection is established before handling
    // requests. If connectDB throws, the server will still start but
    // subsequent requests will fail until the DB is reachable.
    connectDB();
});
