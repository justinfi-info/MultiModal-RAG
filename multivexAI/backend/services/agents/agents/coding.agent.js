import { getModel } from "../config/llmmodel.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentlimit.js";

export const codingAgent = async (state) => {
    try {
    await checkAgentLimit(state.userId, "coding")
    const llm = await getModel("coding")
    const intentLlm = await getModel("intent")
    const intentRes = await intentLlm.invoke(`
        You are an intent classifier.
        Return Only one of these values.
        - CODE_GENERATION
        - CODE_REVIEW
        - DEBUGGING
        - OPTIMIZATION
        - CONVERSATION
        - DOCUMENTATION

Definitions:

CODE_GENERATION:
The user wants you to create new code, functions, components, scripts, APIs, or a complete implementation.

CODE_REVIEW:
The user provides existing code and asks for feedback, analysis, correctness checks, or suggestions without primarily asking to fix an error.

DEBUGGING:
The user reports an error, exception, unexpected behavior, or broken code and wants help identifying or fixing the problem.

OPTIMIZATION:
The user wants to improve performance, efficiency, scalability, memory usage, readability, or resource consumption of existing code.

CONVERSATION:
The user is asking a general question, greeting, casual conversation, explanation, or something unrelated to a specific coding task.

DOCUMENTATION:
The user wants documentation, comments, API documentation, README content, usage instructions, or an explanation of how existing code/API works.

Return ONLY the classification value.
 
User Request:
    ${state.prompt}
    `)
    const intent = intentRes.content
    if (intent.trim().toUpperCase().includes("CODE_GENERATION")) {
        const prompt = `
        You are MultivexAI Coding Agent.

Generate the requested project based on the user's requirements.

Default stack:
- HTML
- CSS
- JavaScript
- Python when backend functionality is required

Use React, Next.js, Vue, or other frameworks ONLY if explicitly requested by the user.

Project rules:
- Create responsive designs.
- Use a modern and clean UI.
- Use CSS variables where appropriate.
- Use Flexbox and/or CSS Grid for layouts.
- Add smooth scrolling when appropriate.
- Add subtle hover effects and transitions.
- Use clean typography and beautiful spacing.
- Build a single-page application unless the user explicitly requests multiple pages.
- Include only the files required for the requested project.
- Ensure all generated code is complete and functional.

IMAGES
========================================

Always use real Unsplash images.
Never use placeholders.

Return ONLY valid JSON.

Required schema:

{
  "files": [
    {
      "name": "index.html",
      "content": "..."
    },
    {
      "name": "style.css",
      "content": "..."
    },
    {
      "name": "script.js",
      "content": "..."
    }
  ]
}

If a Python backend is required, include:

{
  "name": "app.py",
  "content": "..."
}

JSON rules:
- Output must start with {
- Output must end with }
- Return valid parseable JSON.
- Escape quotes, newlines, and special characters correctly inside file content.
- Do not use Markdown.
- Do not include explanations.
- Do not include comments outside the generated files.
- Do not include code fences.
- Do not include extra text before or after the JSON.
- Never mention intent.
- Never return invalid JSON.

User request:
    ${state.prompt}
        `
        const res = await llm.invoke(prompt)
        console.log(res)

        // Models sometimes wrap JSON in markdown fences or add prose around it.
        // Strip fences and slice to the outermost JSON object before parsing.
        const raw = String(res.content ?? "")
        const unfenced = raw.replace(/```(?:json)?/gi, "").trim()
        const start = unfenced.indexOf("{")
        const end = unfenced.lastIndexOf("}")
        const jsonText = start !== -1 && end > start ? unfenced.slice(start, end + 1) : unfenced

        let data
        try {
            data = JSON.parse(jsonText)
        } catch (parseError) {
            console.error("CodingAgent JSON parse failed:", parseError?.message)
            console.error("CodingAgent raw model output:", raw.slice(0, 500))
            await deductCredits(state.userId,"coding")
            return {
                ...state,
                aiResponse: "The coding model returned malformed JSON, so no project files could be extracted. Please try again.",
                artifacts: []
            }
        }

        const files = (data.files || []).filter(f => f?.name && String(f?.content ?? "").trim())

        if (files.length === 0) {
            return {
                ...state,
                aiResponse: "The coding model returned no file contents. Please try again.",
                artifacts: []
            }
        }

        return {
            ...state,
            aiResponse: "Code Generated Successfully.",
            artifacts: [
                {
                    id: Date.now(),
                    type: "Project",
                    files,
                    title: state.prompt
                }
            ]
        }
    }
    const res = await llm.invoke(`
        The user's request is:
    ${state.prompt}
    Return Markdown only.

    Never generate project files.
    
    Use heading like:
    # Overview
    ## Explanation
    ## Problems
    ## Improvements
    ## Best Practices
    ## Optimized Code (if needed)

    ${state.prompt}
        `)
        const data = res.content
        await deductCredits(state.userId,"coding")
        return {
            ...state,
            aiResponse:data,
            artifacts:[]
        }
    } catch (error) {
        console.error("CodingAgent error:", error?.message || error)
            return {
                ...state,
                aiResponse: error?.data?.message || "Sorry, the coding model is temporarily unavailable (rate limited). Please try again in a moment.",
                artifacts: []
            }
    }
}