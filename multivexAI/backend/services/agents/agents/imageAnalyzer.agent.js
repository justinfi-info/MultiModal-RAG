import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getModel } from "../config/llmmodel.js"
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentlimit.js";
import fs from "fs"

export const imageAnalyzer = async (state) => {
    try {
        await checkAgentLimit(state.userId, "image")
        const llm = await getModel("imageAnalyzer")
        const imageBuffer = fs.readFileSync(state.file.path)
        const base64Image = imageBuffer.toString("base64")

        const message = [
            new SystemMessage(
                `You are MultivexAi image analyzer Agent.

            Rules:
            - Analyzer only the uploaded image.
            - Answer the user's question accurately.
            - If text exists in the image, extract it.
            - If charts or tables exist, explain them.
            - If something is unclear, say so.
            - Use Markdown when helpful.
            - Do not hallucinate.`
            ),
            new HumanMessage({
                content: [
                    {
                        type: "text",
                        text: state.prompt || "analyze the image"
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${state.file.mimetype};base64,${base64Image}`
                        }
                    }
                ]
            })
        ]

        const response = await llm.invoke(message)
        await deductCredits(state.userId,"image")
        return {
            ...state,
            aiResponse: response.content
        }
    } catch (error) {
        console.log(error)
                return {
                ...state,
                aiResponse: error?.data?.message || "Failed to analyze image"
        }
    } finally {
        if (state.file?.path) {
            fs.unlink(state.file.path, (err) => {
                if (err) console.log("failed to delete uploaded file:", err.message)
            })
        }
    }
}
