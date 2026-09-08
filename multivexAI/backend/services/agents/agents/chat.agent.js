import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmmodel.js"
import { getMemory } from "../config/memory.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentlimit.js";

export const ChatAgent = async(state)=> {
    try {

    await checkAgentLimit(state.userId, "chat")
            
    const llm = await getModel("chat")
    const history = await getMemory(state.conversationId) || []
    const searchContext = state.searchResults?
    `Web Search Results:
    ${JSON.stringify(state.searchResults)}

    Use the above search results to answer. Do not mention internal tools.
    `: ""

    const now = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "long"
    })

const systemPrompt = `
You are MultiverAI, an intelligent AI assistant.

Current date and time (Asia/Kolkata): ${now}
For questions about the current date or time, answer directly from the value above. Do not tell the user to visit an external clock website.

${searchContext}

# Rules:

- For simple questions, greetings, and short queries, respond naturally in plain text.
- For technical, educational, coding, or detailed topics, use clean Markdown.

# Formatting

- Use # for titles.
- Use ## for sections.
- Leave a blank line after every heading.
- Use bullet points for lists.
- Use numbered lists for sequential steps.
- Use fenced code blocks with language tags for code.
- Keep paragraphs short and readable.
- Never put a heading and its content on the same line.
- Never generate large walls of text.
- Prefer clear, concise, well-structured responses.
`;
    const messages = [
        new SystemMessage(systemPrompt)
    ]

    history.forEach(msg => {
        if(msg.role == "user"){
            messages.push(new HumanMessage(msg.content))
        }
        if(msg.role == "assistant"){
            messages.push(new AIMessage(msg.content))
        }
    })

    messages.push(new HumanMessage(state.prompt))
    console.log(messages)

    try {
        const response = await llm.invoke(messages)
        await deductCredits(state.userId,"chat")

        return {
            ...state,
            aiResponse: response.content
        }
    } catch (error) {
        console.error("ChatAgent error:", error)
        return {
            ...state,
            aiResponse: "Sorry, something went wrong while generating a response."
        }
    }

    } catch (error) {
       console.log(error)
                return {
                ...state,
                aiResponse: error?.data?.message || "Failed to generate"
            }
    }



}
