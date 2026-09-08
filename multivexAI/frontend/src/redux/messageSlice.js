import { createSlice } from "@reduxjs/toolkit"

const messageSlice = createSlice({
    name: "message",
    initialState: {
        messages: [],
        artifacts: [],
        isLoading: false

    },
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload
        },

        addMessage: (state, action) => {
            state.messages.push(action.payload)
        },

        setArtifacts: (state, action) => {
            state.artifacts = (action.payload)
        },

        setLoading: (state, action) => {
            state.isLoading = (action.payload)
        },

        // Clears the active session view only. Nothing is deleted server-side,
        // so artifacts of older conversations stay retrievable by reselecting them.
        resetChat: (state) => {
            state.messages = []
            state.artifacts = []
            state.isLoading = false
        },
        
        patchMessage: (state, action) => {
            const { _id, ...changes } = action.payload
            const index = state.messages.findIndex(c => c?._id === _id)
            if (index !== -1) {
                state.messages[index] = { ...state.messages[index], ...changes }
            }
        },
        removeMessage: (state, action) => {
            const id = action.payload
            state.messages = state.messages.filter(c => c?._id !== id)
        }
    }
})

export const { setMessages, addMessage, patchMessage, removeMessage, setArtifacts, setLoading, resetChat } = messageSlice.actions
export default messageSlice.reducer