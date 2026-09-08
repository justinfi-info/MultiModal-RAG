import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter";
import dotenv from "dotenv"

dotenv.config()

/* 
|-----------------------------------
| Groq 
|-----------------------------------
*/

const groq = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0.1,
    apiKey: process.env.GROQ_API_KEY
})

/* 
|-----------------------------------
| Gemini 
|-----------------------------------
*/

const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY
})

/* 
|-----------------------------------
| OpenRouter - openrouter/free 
|-----------------------------------
*/

const openrouter = new ChatOpenRouter({
    model: "openrouter/free",
    temperature: 0.1,
    maxTokens: 2500,
    timeout: 30000,
    maxRetries: 1,
    apiKey: process.env.OPENROUTER_API_KEY,
});


/* 
|-----------------------------------
| Model Router
|-----------------------------------
*/

export const getModel = async (agent) => {
    switch (agent) {
        case "chat":
            return groq;

        case "search":
            return gemini;

        case "coding":
            return groq;

        case "pdfRag":
            return gemini;

        case "pdf":
            return gemini;

        case "ppt":
            return gemini;

        case "imageGen":
            return gemini

        case "imageAnalyzer":
            return gemini

        default:
            return groq;
    }
}