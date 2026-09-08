import Redis from "ioredis";

// Each service that imports this module must provide its own REDIS_URL
// via its own .env (e.g. gateway/.env, services/auth/.env).
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl);

redis.on("connect", () => {
    console.log("redis connected");
    console.log("using Redis URL:", redisUrl);
});

redis.on("error", (err) => {
    console.error("redis error:", err.message);
});

export default redis;
