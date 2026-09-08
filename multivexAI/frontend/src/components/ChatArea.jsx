import React from "react";
import Nav from './Nav'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import getMessages from "../features/getMessages.js";
import { resetChat, setArtifacts, setMessages } from "../redux/messageSlice.js";

function ChatArea() {
    const { selectedConversation } = useSelector(state => state.conversation)
    const dispatch = useDispatch()

    useEffect(() => {
        // No conversation selected ("New chat"): show a clean session.
        if (!selectedConversation) {
            dispatch(resetChat())
            return
        }

        // Freshly created conversation has no stored messages yet, and the
        // pending user message may already be in state, so skip the fetch.
        if (selectedConversation.title === "New Chat") return

        // Guards against a slow response for a conversation the user
        // already navigated away from overwriting the current one.
        let cancelled = false

        const getMesg = async () => {
            const data = await getMessages(selectedConversation._id)
            if (cancelled) return
            const messages = Array.isArray(data) ? data : []
            dispatch(setMessages(messages))
            const latestArtifactMessage = [...messages].reverse().find(msg => msg.artifacts && msg.artifacts.length > 0)
            dispatch(setArtifacts(latestArtifactMessage?.artifacts || []))
        }
        getMesg()

        return () => { cancelled = true }
    }, [selectedConversation?._id, dispatch])

    return (
        <div className='flex-1 flex flex-col min-w-0'>
            <Nav />
            <MessageList />
            <ChatInput />
        </div>
    )
}

export default ChatArea
