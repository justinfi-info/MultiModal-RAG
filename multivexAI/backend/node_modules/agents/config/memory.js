import redis from "../../../shared/redis/redis.js"
import { getMessages } from "../utils/getMessages.js"

export const getMemory = async (conversationId) => {
    try {
        const key = `messages-${conversationId}`
        const cached = await redis.get(key)
        if (cached) {
            return JSON.parse(cached)
        }
        const messages = await getMessages(conversationId)
        const safeMessages = Array.isArray(messages) ? messages : []
        await redis.set(key, JSON.stringify(safeMessages), "EX", 24 * 60 * 60)

        return safeMessages
    } catch (error) {
        console.error("getMemory error:", error)
        return []
    }
}

export const addMessage = async (conversationId, role, content) => {
    try {
        const key = `messages-${conversationId}`
        const rawMessages = await redis.get(key)
        const messages = rawMessages ? JSON.parse(rawMessages) : []
        if (!Array.isArray(messages)) return
        messages.push({ role, content })

        if (messages.length > 20) {
            messages.shift()
        }
        await redis.set(key, JSON.stringify(messages))
    } catch (error) {
        console.error("addMessage error:", error)
    }
}