import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings.js"
import dotenv from "dotenv"

dotenv.config()

// Adds documents to a Qdrant collection, creating it if needed.
export const addToVectorStore = async (docs, collectionName) => {
    // fromDocuments(docs, embeddings, config) both instantiates the store
    // and adds the documents.
    return await QdrantVectorStore.fromDocuments(docs, embeddings, {
        url: process.env.QDRANT_URL,
        collectionName
    });
};

// Returns a store bound to an existing collection for retrieval.
export const vectorStore = async (collectionName) => {
    return await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName
    });
};
