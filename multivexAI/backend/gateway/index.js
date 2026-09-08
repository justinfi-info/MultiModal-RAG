import express from "express"
import dotenv from "dotenv"
import proxy from "express-http-proxy"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "path"
import { fileURLToPath } from "url"
import { getCurrentUser } from "./controllers/user.controller.js"
import protect from "./middleware/auth.middleware.js"
import { proxyWithHeader } from "./utils/proxyWithHeader.js"
import morgan from "morgan"
// Load environment variables from the gateway's .env file, resolved relative
// to this module so the gateway starts correctly from any working directory.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, ".env") })

// Fail fast with a clear message instead of a proxy assertion if the
// .env failed to load.
const missing = ["AUTH_SERVICE", "CHAT_SERVICE", "AGENTS_SERVICE", "BILLING_SERVICE"]
    .filter(name => !process.env[name])
if (missing.length) {
    console.error(`gateway: missing required env vars: ${missing.join(", ")}`)
    console.error(`gateway: set them in gateway/.env (loaded via env_file in docker-compose.yml), or pass --env-file gateway/.env / -e KEY=value to docker run`)
    process.exit(1)
}

// Fallback to 8000 if PORT is not set
const port = process.env.PORT || 8000
const app = express()
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))

app.use(morgan("dev"))

app.use(cookieParser())

// Proxy /auth to the authentication service defined in AUTH_SERVICE
app.use("/api/auth", proxy(process.env.AUTH_SERVICE))

app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE))

app.use("/api/agent", protect, proxyWithHeader(process.env.AGENTS_SERVICE))

app.use("/api/billing", protect, proxyWithHeader(process.env.BILLING_SERVICE))

app.get("/api/me",protect,getCurrentUser)

app.get("/", (req, res) => {
    res.json({ message: "hello from gateway" });
});

app.listen(port, () => {
    console.log(`gateway started at ${port}`);
});


