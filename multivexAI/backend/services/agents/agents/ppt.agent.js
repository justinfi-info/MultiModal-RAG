import { getModel } from "../config/llmmodel.js"
import { uploadToS3 } from "../utils/uploadTos3.js"
import { getFromS3 } from "../utils/getFroms3.js"
import { generatePPT } from "../utils/generatePPT.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentlimit.js";

export const pptAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "ppt")
        const llm = await getModel("ppt")
        const prompt = `
You are an expert in PowerPoint presentations designer. Your task is to generate a PowerPoint presentation based on the user's request. The user will provide a topic, and you should create a presentation with relevant slides, titles, and content.
 Return Only valid JSON
 
 Format:
 {
 "title": "",
 "Subtitle": "",
    "slides": [
{
    "title": "",
    "points": [
    "",
    "",
    "",
    ""
    ]
}
]
}

Rules:
- Generate 4-8 content slides.
- Each slide should have a title and 3-6 concise bullet points.
- No slide should be empty.
- No markdown, explanations, or additional text outside the JSON structure.
- No code block.
- Return Only JSON.

Topic: ${state.prompt}

}
 }

`
        const res = await llm.invoke(prompt)
        const data = JSON.parse(res.content)
        await deductCredits(state.userId, "ppt")
        const buffer = await generatePPT(data)
        const filename = `ppt_${Date.now()}.pptx`

        await uploadToS3(filename, buffer, "application/vnd.openxmlformats-officedocument.presentationml.presentation")
        const downloadUrl = await getFromS3(filename, 24 * 60 * 60) // 24 hours expiration

        return {
            ...state,
            aiResponse: `PPT Generated Successfully.
**${data.title}**
[Download PPT](${downloadUrl})
Link expires in 10 minutes.`
        }
    } catch (error) {
        console.log(error)
        return {
            ...state,
            aiResponse: error?.data?.message || "Failed to generate ppt"
        }
    }
}