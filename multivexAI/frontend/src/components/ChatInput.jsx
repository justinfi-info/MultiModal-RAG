import { Code2, FileText, Globe, ImageIcon, MessageSquare, Mic, Paperclip, Presentation, Send, X, Zap } from "lucide-react"
import React, { useState } from "react"
import sendMessage from "../features/sendMessage.js"
import { useDispatch, useSelector } from "react-redux"
import { addMessage, setArtifacts, setLoading } from "../redux/messageSlice.js"
import { createConversation } from "../features/createConversation.js"
import { addConversation, setConvTitle, setSelectedConversation } from "../redux/conversationSlice.js"
import { updateConversation } from "../features/updateConversation.js"
import { useRef } from "react"
import { ACCEPT_ATTRIBUTE, validateFile } from "../utils/fileValidation.js"

function ChatInput() {
    const [value, setValue] = useState("")
    const [selectedAgent, setSelectedAgent] = useState("Auto")
    const { selectedConversation } = useSelector(state => state.conversation)
    const { messages, isLoading } = useSelector(state => state.message)
    const [selectedFile, setSelectedFile] = useState(null)
    const [fileError, setFileError] = useState(null)
    const fileRef = useRef(null)
    const dispatch = useDispatch()
    const showFileError = (message) => {
        setFileError(message)
        setTimeout(() => setFileError(null), 5000)
    }

    const handleSendMessage = async (e) => {
        e?.preventDefault()
        dispatch(setLoading(true))

        let conversation = selectedConversation

        if (!selectedConversation) {
            const conv = await createConversation()
            dispatch(setSelectedConversation(conv))
            dispatch(addConversation(conv))
            conversation = conv
        }

        if (conversation.title == "New Chat") {
            await updateConversation({ id: conversation?._id, title: value.trim() })
            dispatch(setConvTitle({ conversationId: conversation._id, title: value.slice(0, 40) }))
        }

        const formData = new FormData()
        formData.append("prompt",value.trim())
        formData.append("conversationId", conversation?._id)
        formData.append("agent", selectedAgent.toLowerCase())

        let attachment = null
        if (selectedFile) {
            // Safety net in case the file changed since selection.
            const error = validateFile(selectedFile)
            if (error) {
                showFileError(error)
                dispatch(setLoading(false))
                return
            }
            formData.append("file", selectedFile)
            attachment = {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                previewUrl: selectedFile.type?.startsWith("image/")
                    ? URL.createObjectURL(selectedFile)
                    : null
            }
        }
        setSelectedFile(null)

        dispatch(addMessage({
            role: "user",
            content: value.trim(),
            attachment
        }))
        setValue("")
        const data = await sendMessage(formData)
        dispatch(setLoading(false))
        if (data?.error) {
            showFileError(data.error)
            return
        }
        if (data) {
            dispatch(setArtifacts(data.artifact || data.artifacts || []))
            dispatch(addMessage({
                role: "assistant",
                content: data?.answer,
                images: data.images
            }))
        }
    }

    const agents = [
        {
            id: "auto",
            icon: Zap,
            label: "Auto"
        },

        {
            id: "chat",
            icon: MessageSquare,
            label: "chat"
        },

        {
            id: "coding",
            icon: Code2,
            label: "Coding"
        },

        {
            id: "pdf",
            icon: FileText,
            label: "PDF"
        },

        {
            id: "ppt",
            icon: Presentation,
            label: "PPT"
        },

        {
            id: "image",
            icon: ImageIcon,
            label: "Image"
        },

        {
            id: "Search",
            icon: Globe,
            label: "Search"
        }
    ]

    return (
        <div className='w-full overflow-hidden px-3 md:px-5 border-t border-white/[0.06] bg-[#0d0f14]'>
            <div className='flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 pt-3.5 pb-3'>

                <div className='flex w-full gap-2 pr-2 flex-wrap'>
                    {agents.map((agent) => {
                        const isActive = selectedAgent === agent.label
                        const Icon = agent.icon
                        return (
                            <div
                            key={agent.id}
                            onClick={()=> setSelectedAgent(agent.label)}
                            className={`flex-shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all ${
                                isActive
                                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_1px_8px_rgba(99,102,241,.35)]"
                                    : "bg-white/[0.03] text-slate-400 hover:bg-white/[0.07]"
                            }`}>

                                < Icon size = { 14}
                            className = {
                                isActive
                                ? "text-white"
                                    : "text-slate-500"
                            } />

                            {agent.label}

                        </div>
                )
                })}
            </div>

            {selectedFile && (
                <div className='flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] w-fit max-w-full'>
                    {selectedFile.type?.startsWith("image/") ? (
                        <img src={URL.createObjectURL(selectedFile)}
                            className="w-9 h-9 rounded-lg object-cover border border-white/10" />
                    ) : (
                        <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-400/20'>
                            <FileText size={16} className="text-indigo-400" />
                        </span>
                    )}
                    <div className='flex flex-col min-w-0'>
                        <span className='text-[12px] text-slate-200 truncate max-w-[220px]'>{selectedFile.name}</span>
                        <span className='text-[11px] text-slate-500'>
                            {(selectedFile.size / 1024).toFixed(0)} KB
                        </span>
                    </div>
                    <button onClick={() => setSelectedFile(null)}
                        className='ml-1 flex items-center justify-center w-6 h-6 rounded-lg text-slate-500
                            hover:text-slate-300 hover:bg-white/[0.08] transition-all duration-150 cursor-pointer'>
                        <X size={13} />
                    </button>
                </div>
            )}

            {fileError && (
                <div className='flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/25 w-fit max-w-full'>
                    <span className='text-red-400 text-[12px]'>{fileError}</span>
                    <button onClick={() => setFileError(null)}
                        className='flex items-center justify-center w-5 h-5 rounded-md text-red-400/70
                            hover:text-red-300 hover:bg-red-500/15 transition-all duration-150 cursor-pointer'>
                        <X size={12} />
                    </button>
                </div>
            )}

            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    // Enter sends, Shift+Enter inserts a newline.
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        if (value.trim()) handleSendMessage(e)
                    }
                }}
                placeholder='Ask Anything...'
                className="w-full bg-transparent outline-none resize-none text-[14px] text-slate-200
                    placeholder:text-slate-500 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                    disabled:opacity-50"
                rows={3}
            />

            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1'>
        <input type="file" accept={ACCEPT_ATTRIBUTE} hidden ref={fileRef} onChange={(e)=> {
            const file=e.target.files[0]
            if(file){
                const error = validateFile(file)
                if (error) {
                    showFileError(error)
                } else {
                    setFileError(null)
                    setSelectedFile(file)
                }
            }
            e.target.value = null
        }}/>
                    <button className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-600
                                hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06]
                                transition-all duration-150 bg-transparent cursor-pointer'>
                        <Paperclip size={16} onClick={()=>fileRef.current.click()}/>
                    </button>

                    <button className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-600
                                hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06]
                                transition-all duration-150 bg-transparent cursor-pointer'>
                        <Mic size={16} />
                    </button>
                </div>

                <button
                    disabled={!value.trim() && isLoading}
                    onClick={handleSendMessage}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer
                            transition-all duration-150 ${value.trim() ? "bg-gradient-to-br from-indigo-500 to-violet-700 hover:opacity-90 text-white"
                            : "bg-white/[0.05] text-slate-600 cursor-not-allowed"}`}>
                    <Send size={15} />
                </button>
            </div>
        </div>
        </div >
    )
}

export default ChatInput
