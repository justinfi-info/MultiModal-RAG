import mongoose from "mongoose"

// Retry forever with a delay so a service started before the DB is
// reachable (e.g. paused Atlas cluster) recovers on its own instead of
// silently 500ing on every request until a manual restart.
const connectDB = async (retries = 0) => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log(`db connected`)
    } catch (error) {
        console.log(`db error (attempt ${retries + 1}) ${error}`)
        setTimeout(() => connectDB(retries + 1), 5000)
    }
}

export default connectDB
