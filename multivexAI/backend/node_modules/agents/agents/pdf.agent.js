import { getModel } from "../config/llmmodel.js";
import { generatePDF } from "../utils/generatePDF.js";
import { uploadToS3 } from "../utils/uploadTos3.js";
import { getFromS3 } from "../utils/getFroms3.js";
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentlimit.js";

export const pdfAgent=async (state)=> {
        try {
            await checkAgentLimit(state.userId, "pdf")
            const llm = await getModel("pdf")
            const prompt = `
You are an expert in analyzing and extracting information from PDF documents 
You are expert document writer.
You are given a PDF document and a user query. Your task is to analyze the PDF document and provide a detailed response to the user query based on the content of the PDF.

Return Only vaild JSON
 DO NOT return markdown.
 Do Not Return explanations.

 Structure:
 {
 "title":"",
 "subtitle":"",
 "sections":[
 {
 "heading":"",
 "points":[]
 }]
        }

Generate 4-8 sections.
Each section should have 3-6 concise bullet points.
Topic:
${state.prompt}`

const res = await llm.invoke(prompt)
const data = JSON.parse(res.content)
await deductCredits(state.userId,"pdf")
const pdfBuffer = await generatePDF(data)
const filename = `pdf_${Date.now()}.pdf`

await uploadToS3(filename, pdfBuffer, "application/pdf")
const downloadUrl = await getFromS3(filename, 24 * 60 * 60) // 24 hours expiration
return {
    ...state,
    aiResponse: `PDF Generated Successfully.
**${data.title}**
[Download PDF](${downloadUrl})
Link expires in 10 minutes.`,
    }
        } catch (error) {
            console.log(error)
                return {
                ...state,
                aiResponse: error?.data?.message || "Failed to generate pdf"
            }
        }
}
