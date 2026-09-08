import React, { useState } from 'react'
import { ExternalLink, FileText, X, Check, Copy } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import useThemeMode from '../features/useThemeMode.js'

function MessageBubble({ role, content, images, attachment }) {
    const isUser = role === "user"
    const [lightBox, setLightBox] = useState(null)
    const [copiedCode, setCopiedCode] = useState("")
    const isLight = useThemeMode()

    const copyCode = async (value) => {
        await navigator.clipboard.writeText(value)
        setCopiedCode(value)
        setTimeout(() => {
            setCopiedCode("")
        }, 2000)
    }

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`w-fit max-w-[92vw] md:max-w-[72%] px-4 py-2.5 rounded-2xl break-words overflow-hidden leading-relaxed
                ${isUser
                    ? "bg-gradient-to-br from-indigo-500 to-violet-700 text-white rounded-tr-sm"
                    : "text-slate-200 rounded-tl-sm"}`}>

                {attachment && (
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border mb-2 w-fit max-w-full
                        ${isUser ? "bg-white/10 border-white/15" : "bg-white/[0.05] border-white/[0.08]"}`}>
                        {attachment.previewUrl ? (
                            <img src={attachment.previewUrl}
                                onClick={() => setLightBox(attachment.previewUrl)}
                                className="w-12 h-12 rounded-lg object-cover border border-white/15 cursor-pointer hover:opacity-90 transition" />
                        ) : (
                            <span className='flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-400/20'>
                                <FileText size={17} className="text-indigo-400" />
                            </span>
                        )}
                        <div className='flex flex-col min-w-0'>
                            <span className='text-[12px] font-medium truncate max-w-[240px]'>{attachment.name}</span>
                            {attachment.size ? (
                                <span className='text-[11px] opacity-70'>
                                    {attachment.size >= 1024 * 1024
                                        ? `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
                                        : `${Math.max(1, Math.round(attachment.size / 1024))} KB`}
                                </span>
                            ) : null}
                        </div>
                    </div>
                )}

                {images?.length > 0 && (
                    <div className='flex flex-wrap gap-3 mt-4'>
                        {images.map((img, i) => (
                            <img
                                key={i}
                                src={img}
                                onClick={() => setLightBox(img)}
                                loading="lazy"
                                onError={(e) => e.currentTarget.remove()}
                                className="w-40 h-28 rounded-xl object-cover border border-white/10 cursor-pointer hover:opacity-90 transition"
                            />
                        ))}
                    </div>
                )}
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ children }) => (
                            <h1 className='text-2xl font-bold mt-5 mb-3'>{children}</h1>
                        ),
                        h2: ({ children }) => (
                            <h2 className='text-xl font-semibold mt-4 mb-2'>{children}</h2>
                        ),
                        h3: ({ children }) => (
                            <h3 className='text-lg font-semibold mt-3 mb-2'>{children}</h3>
                        ),
                        p: ({ children }) => (
                            <p className='mb-3 whitespace-pre-wrap break-words'>{children}</p>
                        ),
                        ul: ({ children }) => (
                            <ul className='list-disc pl-5 space-y-1 my-2'>{children}</ul>
                        ),
                        ol: ({ children }) => (
                            <ol className='list-decimal pl-5 space-y-1 my-2'>{children}</ol>
                        ),
                        table: ({ children }) => (
                            <div className='overflow-x-auto my-4'>
                                <table className='min-w-full border border-white/10'>{children}</table>
                            </div>
                        ),
                        th: ({ children }) => (
                            <th className='border border-white/10 bg-white/5 px-3 py-2 text-left'>{children}</th>
                        ),
                        td: ({ children }) => (
                            <td className='border border-white/10 px-3 py-2'>{children}</td>
                        ),
                        a: ({ href, children }) => (
                            <a href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 underline inline-flex items-center gap-1">
                                {children}
                                <ExternalLink size={14} />
                            </a>
                        ),
                        code: ({ className, children }) => {
                            const value = String(children).trim()
                            if (!className) {
                                return (
                                    <code className='px-1.5 py-0.5 rounded bg-white/10 text-indigo-300'>
                                        {value}
                                    </code>
                                )
                            }
                            const language = className?.replace("language-", "")
                            return (
                                <div className='my-4 overflow-hidden rounded-xl border border-white/10'>
                                    <div className='flex items-center justify-between bg-[#1b1d24] border-b border-white/10 px-4 py-2'>
                                        <span className='uppercase text-xs text-slate-400'>{language}</span>
                                        <button className='flex items-center gap-1 text-xs' onClick={() => copyCode(value)}>
                                            {copiedCode === value ? (
                                                <>
                                                    <Check size={14} />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={14} />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <SyntaxHighlighter
                                        language={language}
                                        style={isLight ? oneLight : oneDark}
                                        customStyle={{
                                            margin: 0,
                                            padding: "16px",
                                            background: isLight ? "#f8fafc" : "#0d1117",
                                            fontSize: "13px",
                                        }}>
                                        {value}
                                    </SyntaxHighlighter>
                                </div>
                            )
                        },
        img:({src})=>{
            if(!src) return null;
            return (
                <img
                src={src}
                onClick={() => setLightBox(src)}
                loading="lazy"
                onError={(e) => e.currentTarget.remove()}
                className="w-40 h-28 rounded-xl object-cover border border-white/10 cursor-pointer hover:opacity-90 transition"
            ></img>
            )
        }
                    }}>
                    {content}
                </Markdown>

            </div>
            {lightBox && (
                <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6'>
                    <button className='absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 rounded-full p-2'
                        onClick={() => setLightBox(null)}>
                        <X />
                    </button>
                    <img src={lightBox}
                        className="max-w-[90%] max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl object-contain" />
                </div>
            )}
        </div>
    )
}

export default MessageBubble
