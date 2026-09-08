import fs from "fs"
import { PDFParse } from "pdf-parse"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { addToVectorStore } from "../config/qdrant.vectorDB.js";
import { getModel } from "../config/llmmodel.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentlimit.js";

export const pdfRag = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf")
        const buffer = fs.readFileSync(state.file.path)
        const pdf = new PDFParse({
            data: buffer
        })

        const result = await pdf.getText()
        const text = result.text

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 500
        })
        const docs = await splitter.createDocuments([text])
        const collectionName = `pdf-${Date.now()}`;
        const store = await addToVectorStore(docs, collectionName)
        const relevantDocs = await store.similaritySearch(state.prompt, 5)
        const context = relevantDocs.map(d => d.pageContent).join("\n\n")
        const llm = await getModel("pdfRag")

        const message = [
            new SystemMessage(`You are MultiverAI PDF Assistant.
                Rules: 
                - Answer only using information from the uploaded PDF. 
                - Never make up, assume, or hallucinate information.
                - If the answer is not present in the uploaded PDF, reply exactly: 
                "I couldn't find this information in the uploaded PDF."
                - Use Markdown formatting for your responses.
                - Keep answers clear, accurate, and relevant to the user's question.
                - When possible, reference the relevant section, heading, page, or table from the PDF.
                - Do not use outside knowledge unless the user explicitly asks for information beyond the PDF.
                `),
            
            new HumanMessage(`
                Context:${context}
                Question:${state.prompt}
                `)
        ]
        const response = await llm.invoke(message)
        await deductCredits(state.userId,"pdf")

        return {
            ...state,
            aiResponse: response.content
        }
    } catch (error) {
        console.log(error)
        return {
            ...state,
            aiResponse: "Failed to Analyze PDF"
        }
    } finally {
        if (state.file?.path) {
            fs.unlink(state.file.path, (err) => {
                if (err) console.log("failed to delete uploaded file:", err.message)
            })
        }
    }
}
