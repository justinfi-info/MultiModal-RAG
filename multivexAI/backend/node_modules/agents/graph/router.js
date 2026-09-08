import { getModel } from "../config/llmmodel.js"

export const router = async (state) => {
    // An attached file always routes by its type — the specialized agents
    // (pdfRag / imageAnalyzer) are the ones that actually read the file.
    if (state.file) {
        if (state.file.mimetype === "application/pdf") {
            return {
                ...state,
                agent: "pdfRag"
            }
        }

        if (state.file.mimetype?.startsWith("image/")) {
            return {
                ...state,
                agent: "imageAnalyzer"
            }
        }
    }

    if (state.agent && state.agent !== "auto") {
        return {
            ...state,
            agent: state.agent
        }
    }

    const llm = await getModel("router")
    const prompt = `
You are an agent router.

Available agents:
- chat
- search
- coding
- pdf
- ppt
- image

Rules:

chat:
General conversation, explanations, learning, and questions that do not require current information or specialized tools.

search:
Current events, latest information, news, recent developments, or requests that require internet lookup.

coding:
Generate code, debug code, build software projects, software architecture, APIs, or programming-related questions.

pdf:
Questions about generating, analyzing, summarizing, or extracting information from PDF documents.

ppt:
Questions about generating, analyzing, summarizing, or extracting information from PowerPoint presentations.

image:
Requests to generate, create, edit, modify, or analyze images.

Return ONLY one word:
chat
search
coding
pdf
ppt
image

User Query:
${state.prompt}
`;

    let agent = "chat"
    try {
        const response = await llm.invoke(prompt)
        agent = response.content.trim().toLowerCase()
    } catch (error) {
        console.error("Router LLM failed, defaulting to chat:", error.message)
    }

    return {
        ...state,
        agent
    }
}
