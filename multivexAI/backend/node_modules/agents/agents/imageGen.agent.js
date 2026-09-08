import axios from "axios";
import { getModel } from "../config/llmmodel.js";
import { uploadToS3 } from "../utils/uploadTos3.js";
import { getFromS3 } from "../utils/getFroms3.js";
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentlimit.js";


export const imageGenAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "image")
        const llm = await getModel("image")
        const res = await llm.invoke(`
        You are an elite AI image prompt engineer.
        
        Convert the user request into a highly detailed image generation prompt.
        
        Requirements:
        
        - Cinematic lighting
        - Professional composition
        - Ultra realistic
        - Beautifully color palette
        - Sharp focus
        - 8K quality
        - Photorealistic
        - Depth of field
        - Professional photography
        - Stunning visuals
        
    Return only the image prompt.
    
    User Request:
    ${state.prompt}
    `)

        const prompt = res.content.trim()
        const imageUrl = `https://image.pollinations.ai/prompts/${encodeURIComponent(prompt)}`
        const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' })
        await deductCredits(state.userId,"image")
        const buffer = Buffer.from(imageRes.data)
        const filename = `image_${Date.now()}.png`

        await uploadToS3(filename, buffer, "image/png")
        const downloadUrl = await getFromS3(filename, 24 * 60 * 60) // 24 hours expiration

        return {
            ...state,
            aiResponse: `
    
    ![Generated Image](${downloadUrl})
    [Download Image](${downloadUrl})
    Link expires in 10 minutes.`
        }
    } catch (error) {
        console.log(error)
                return {
                ...state,
                aiResponse: error?.data?.message || "Failed to generate image"
        }
    }
}