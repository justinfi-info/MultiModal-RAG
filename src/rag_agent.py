from __future__ import annotations

import os
from typing import TypedDict

import chromadb
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph

load_dotenv()


class AgentState(TypedDict, total=False):
    question: str
    rewritten_question: str
    documents: list[str]
    answer: str
    grade: str
    retry_count: int


api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to your environment before running the agent.")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.1,
    google_api_key=api_key,
)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"},
)


def retrieve(state: AgentState) -> AgentState:
    question = state.get("rewritten_question") or state.get("question", "")
    print(f"\n[RETRIEVE] {question}")

    if not question:
        return {**state, "documents": []}

    results = collection.query(query_texts=[question], n_results=3)
    documents = results.get("documents", [[]])[0]
    print(f"Found {len(documents)} chunks")

    return {**state, "documents": documents}


def generate(state: AgentState) -> AgentState:
    question = state.get("rewritten_question") or state.get("question", "")
    docs = state.get("documents", [])
    context = "\n\n".join(docs)

    prompt = f"""
Answer only from the documents.
Documents:
{context}

Question:
{question}
"""

    response = llm.invoke(
        [
            SystemMessage(content="You answer using only provided context."),
            HumanMessage(content=prompt),
        ]
    )

    return {**state, "answer": response.content if hasattr(response, "content") else str(response)}


def grade_answer(state: AgentState) -> AgentState:
    prompt = f"""
Check if answer is supported by documents.
Documents:
{state.get('documents', [])}
Answer:
{state.get('answer', '')}
Reply ONLY:
YES or NO
"""

    result = llm.invoke(prompt)
    grade = result.content.strip() if hasattr(result, "content") else str(result).strip()
    print("[GRADE]", grade)
    return {**state, "grade": grade}


def rewrite_question(state: AgentState) -> AgentState:
    prompt = f"""
Rewrite this question for better search retrieval:
{state.get('question', '')}
"""
    result = llm.invoke(prompt)
    rewritten = result.content.strip() if hasattr(result, "content") else str(result).strip()
    return {
        **state,
        "rewritten_question": rewritten,
        "retry_count": state.get("retry_count", 0) + 1,
    }


def check_result(state: AgentState) -> str:
    if state.get("grade") == "YES":
        return "done"
    if state.get("retry_count", 0) >= 2:
        return "done"
    return "retry"


graph = StateGraph(AgentState)
graph.add_node("retrieve", retrieve)
graph.add_node("generate", generate)
graph.add_node("grade", grade_answer)
graph.add_node("rewrite", rewrite_question)
graph.set_entry_point("retrieve")
graph.add_edge("retrieve", "generate")
graph.add_edge("generate", "grade")
graph.add_conditional_edges(
    "grade",
    check_result,
    {"done": END, "retry": "rewrite"},
)
graph.add_edge("rewrite", "retrieve")
app = graph.compile()


if __name__ == "__main__":
    question = input("Ask: ").strip()
    result = app.invoke({"question": question, "retry_count": 0})
    print("\nFINAL ANSWER\n")
    print(result.get("answer", ""))