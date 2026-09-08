import axios from "axios"
import fs from "fs"
import { graph } from "../graph/graphs.js"
import { addMessage } from "../config/memory.js"
import { validateFileSignature } from "../config/fileValidation.js"

export const agent = async (req, res, next) => {
    try {
        const { prompt, conversationId, agent } = req.body
        const file = req.file
        const userId = req.headers["x-user-id"]

        // Verify the file's actual content matches its extension — a renamed
        // or manipulated file is rejected before any processing happens.
        if (file) {
            const signatureError = validateFileSignature(file.path, file.originalname)
            if (signatureError) {
                fs.unlink(file.path, () => {})
                return res.status(400).json({ message: signatureError })
            }
        }
        // await redis.del(`messages-${conversationId}`)

        const attachment = file ? {
            name: file.originalname,
            type: file.mimetype,
            size: file.size
        } : undefined

        try {
            await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
                conversationId,
                role: "user",
                content: prompt,
                attachment
            })
        } catch (e) {
            console.error("Failed to save user message to chat service:", e.message)
        }

        const result = await graph.invoke({ prompt, conversationId, agent, userId, file})
        const response = result.aiResponse

        await addMessage(conversationId, "user", prompt)        
        await addMessage(conversationId, "assistant", response)

        try {
            await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
                conversationId,
                role: "assistant",
                content: result?.aiResponse,
                images: result?.images,
                artifacts: result?.artifacts || []
            })
        } catch (e) {
            console.error("Failed to save assistant message to chat service:", e.message)
        }

        return res.status(200).json({
            answer: result?.aiResponse,
            images: result?.images,
            artifact:result?.artifacts || []
        })

    } catch (error) {
        next(error)
    }
}
