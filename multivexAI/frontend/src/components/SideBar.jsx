import { Archive, Coins, LogOut, Menu, MessageCircle, MessageSquare, MoreHorizontal, PanelLeftIcon, Pencil, PenSquare, Pin, Plus, Search, Share, Trash2, User, X } from "lucide-react"
import { useState } from "react"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { getConversations } from "../features/getConversations.js"
import { addConversation, patchConversation, removeConversation, setConversation, setSelectedConversation } from "../redux/conversationSlice.js"
import { createConversation } from "../features/createConversation.js"
import { updateConversation } from "../features/updateConversation.js"
import { deleteConversation } from "../features/deleteConversation.js"
import { setUserdata } from "../redux/userSlice.js"
import { resetChat } from "../redux/messageSlice.js"
import { signOut } from "firebase/auth"
import { auth } from "../../utils/firebase.js"
import api from "../../utils/axios.js"
import BillingDrawer from "./BillingDrawer.jsx"

// Collapsed-rail icon button with a hover pill (label + optional shortcut).
function RailButton({ icon: Icon, label, shortcut, active, onClick }) {
    return (
        <div className='relative group'>
            <button
                type='button'
                onClick={onClick}
                aria-label={label}
                className={`flex items-center justify-center w-10 h-10 rounded-lg border-none cursor-pointer
                    transition-colors duration-150 ${active
                        ? "bg-white/[0.06] text-slate-100"
                        : "bg-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"}`}>
                <Icon size={20} strokeWidth={1.8} />
            </button>
            <div className={`pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-[95]
                flex items-center gap-2 whitespace-nowrap rounded-full bg-[#2d2d2d] py-1.5 shadow-lg
                opacity-0 -translate-x-1 transition-all duration-150
                group-hover:opacity-100 group-hover:translate-x-0
                ${shortcut ? "pl-3 pr-2" : "px-3"} ${active ? "hidden" : ""}`}>
                <span className='text-[13px] font-medium text-white'>{label}</span>
                {shortcut && (
                    <span className='rounded-full bg-white/[0.14] px-2 py-[3px] text-[11px] font-medium text-gray-300'>
                        {shortcut}
                    </span>
                )}
            </div>
        </div>
    )
}

function SideBar() {
    const [collapsed, setCollapsed] = useState(false)
    const dispatch = useDispatch()
    const [imageError, setImageError] = useState(false)
    const [menu, setMenu] = useState(null)
    const [renamingId, setRenamingId] = useState(null)
    const [renameValue, setRenameValue] = useState("")
    const [flyout, setFlyout] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const { conversations, selectedConversation } = useSelector(state => state.conversation)
    const { userData } = useSelector(state => state.user)
    const [showBilling, setShowBilling] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    useEffect(() => {
        const getConv = async () => {
            const data = await getConversations()
            dispatch(setConversation(data))
        }
        getConv()
    }, [userData?._id])

    // Archived chats are hidden from the list; pinned chats float to the top.
    const visibleConversations = [...conversations]
        .filter(conv => !conv?.archived)
        .sort((a, b) => (b?.pinned ? 1 : 0) - (a?.pinned ? 1 : 0))

    const handleCreateConversation = async () => {
        const data = await createConversation()
        dispatch(resetChat())
        dispatch(addConversation(data))
        dispatch(setSelectedConversation(data))
    }

    const handleLogout = async () => {
        try {
            await api.get("/api/auth/logout")
            await signOut(auth)
        } catch (error) {
            console.error("logout error", error)
        } finally {
            dispatch(setUserdata(null))
        }
    }

    const toggleFlyout = (type) => {
        setFlyout(prev => (prev === type ? null : type))
        if (type !== "search") setSearchQuery("")
    }

    const openMenu = (e, conv) => {
        e.stopPropagation()
        if (menu?.id === conv._id) {
            setMenu(null)
            return
        }
        const rect = e.currentTarget.getBoundingClientRect()
        const width = 176
        let left = rect.right - width
        if (left < 8) left = 8
        setMenu({ id: conv._id, top: rect.bottom + 6, left })
    }

    const handleShare = async (conv) => {
        setMenu(null)
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/?c=${conv._id}`)
        } catch (error) {
            console.log(error)
        }
    }

    const handleRename = (conv) => {
        setMenu(null)
        setRenamingId(conv._id)
        setRenameValue(conv?.title || "")
    }

    const commitRename = async (conv) => {
        const title = renameValue.trim()
        setRenamingId(null)
        if (!title || title === conv?.title) return
        dispatch(patchConversation({ _id: conv._id, title }))
        await updateConversation({ id: conv._id, title })
    }

    const handleTogglePin = async (conv) => {
        setMenu(null)
        const pinned = !conv?.pinned
        dispatch(patchConversation({ _id: conv._id, pinned }))
        await updateConversation({ id: conv._id, pinned })
    }

    const handleArchive = async (conv) => {
        setMenu(null)
        dispatch(patchConversation({ _id: conv._id, archived: true }))
        await updateConversation({ id: conv._id, archived: true })
    }

    const handleDelete = async (conv) => {
        setMenu(null)
        dispatch(removeConversation(conv._id))
        await deleteConversation(conv._id)
    }

    const menuItemCls = `w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-left
        bg-transparent border-none cursor-pointer transition-colors duration-150`

    // ── Shared profile / user-controls block (used inside the fixed footer) ──
    const profileControls = (
        userData ? (
            <div className='flex items-center gap-2.5 rounded-xl
                px-3 py-2.5 hover:bg-white/[0.05] transition-colors duration-150'>
                <div className='relative shrink-0'>
                    {
                        (userData?.avatar && !imageError)
                            ?
                            <img className='w-9 h-9 rounded-[10px] object-cover border-2
                                border-indigo-500/25'
                                src={userData?.avatar}
                                alt={userData?.name || "User"}
                                onError={() => setImageError(true)} />
                            :
                            <div className='w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center'>
                                <User size={15} className="text-slate-400" />
                            </div>
                    }
                </div>

                <div className='flex flex-col min-w-0 flex-1'>
                    <p className='text-[13.5px] font-semibold text-slate-100 truncate'>{userData?.name || "user"}</p>
                    <p className='text-[11px] text-slate-600 mt-px capitalize'>{`${userData?.plan}`}</p>
                </div>

                <div className='flex gap-1'>
                    <button
                    onClick={()=>setShowBilling(true)}
                        title='Credits'
                        className='flex items-center justify-center w-7 h-7 rounded-[7px]
                            border-none bg-transparent text-yellow-500 cursor-pointer
                            hover:bg-white/[0.08] hover:text-yellow-400 transition-all duration-150'>
                        <Coins size={15} />
                    </button>
                    <button
                        onClick={handleLogout}
                        title='Log out'
                        className='flex items-center justify-center w-7 h-7 rounded-[7px]
                            border-none bg-transparent text-slate-500 cursor-pointer
                            hover:bg-white/[0.08] hover:text-rose-400 transition-all duration-150'>
                        <LogOut size={15} />
                    </button>
                </div>

            </div>
        ) : (
            <button className='w-full flex items-center justify-center gap-2 text-sm font-medium
                text-slate-200 bg-white/[0.05] border border-white/[0.08] rounded-xl py-[11px]
                cursor-pointer hover:bg-white/[0.08] transition-colors duration-150'>
                Login
            </button>
        )
    )

    // ── Shared mobile controls — hamburger trigger + drawer backdrop ──
    // On mobile (< lg) the sidebar lives off-canvas; this button opens it.
    const mobileControls = (
        <>
            {/* Hidden while the drawer is open — it would sit above the
                drawer (z-50) and cover its header buttons on mobile. */}
            {!mobileOpen && (
                <button
                    onClick={() => setMobileOpen(true)}
                    aria-label='Open sidebar'
                    className='lg:hidden fixed top-3 left-3 z-[60] flex items-center justify-center w-9
                        h-9 rounded-lg bg-[#0d0f14] border border-white/[0.08] text-slate-400
                        hover:text-slate-200 transition-colors duration-150 cursor-pointer'>
                    <Menu size={16} />
                </button>
            )}
            {mobileOpen && (
                <div onClick={() => setMobileOpen(false)}
                    className='lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm' />
            )}
        </>
    )

    if (collapsed) {
        const recentList = conversations.filter(c => !c?.archived)
        const pinnedList = conversations.filter(c => c?.pinned && !c?.archived)
        const searchList = conversations.filter(c =>
            !c?.archived && (c?.title || "New Chat").toLowerCase().includes(searchQuery.trim().toLowerCase()))
        const flyoutList = flyout === "search" ? searchList : flyout === "pinned" ? pinnedList : recentList
        const flyoutTitle = flyout === "search" ? "Search" : flyout === "pinned" ? "Pinned" : "Recents"

        const selectFromFlyout = (conv) => {
            dispatch(resetChat())
            dispatch(setSelectedConversation(conv))
            setFlyout(null)
            setSearchQuery("")
            setMobileOpen(false)
        }

        return (
            <>
            {mobileControls}
            <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-[64px] h-screen shrink-0
                bg-[#0d0f15] border-r border-white/[0.08] flex flex-col transition-transform duration-200
                ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

                <nav className='flex flex-col items-center gap-1 px-2 pt-3'>
                    <RailButton icon={PanelLeftIcon} label='Open sidebar'
                        onClick={() => setCollapsed(false)} />
                    <RailButton icon={PenSquare} label='New chat' shortcut='Ctrl + Shift + O'
                        onClick={() => { setFlyout(null); handleCreateConversation() }} />
                    <RailButton icon={Search} label='Search' shortcut='Ctrl + K'
                        active={flyout === "search"} onClick={() => toggleFlyout("search")} />
                    <RailButton icon={Pin} label='Pinned'
                        active={flyout === "pinned"} onClick={() => toggleFlyout("pinned")} />
                    <RailButton icon={MessageCircle} label='Recents'
                        active={flyout === "recents"} onClick={() => toggleFlyout("recents")} />
                </nav>

                {/* Fixed footer — avatar + logout, always visible at the bottom */}
                <div className='mt-auto flex flex-col items-center gap-2 py-3'>
                    {userData && (
                        <>
                            {userData?.avatar && !imageError
                                ?
                                <img className='w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25'
                                    src={userData?.avatar}
                                    alt={userData?.name || "User"}
                                    onError={() => setImageError(true)} />
                                :
                                <div className='w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center'>
                                    <User size={16} className='text-slate-400' />
                                </div>}
                            <button
                                onClick={() => setShowBilling(true)}
                                title='Credits'
                                className='flex items-center justify-center w-10 h-10 rounded-lg text-slate-400
                                    hover:text-yellow-400 hover:bg-white/[0.05] transition-colors duration-150
                                    bg-transparent border-none cursor-pointer'>
                                <Coins size={18} />
                            </button>
                            <button
                                onClick={handleLogout}
                                title='Log out'
                                className='flex items-center justify-center w-10 h-10 rounded-lg text-slate-400
                                    hover:text-rose-400 hover:bg-white/[0.05] transition-colors duration-150
                                    bg-transparent border-none cursor-pointer'>
                                <LogOut size={18} />
                            </button>
                        </>
                    )}
                </div>

                {flyout && (
                    <>
                        <div className='fixed inset-y-0 left-16 right-0 z-[80]'
                            onClick={() => { setFlyout(null); setSearchQuery("") }} />
                        <div onClick={(e) => e.stopPropagation()}
                            className='absolute left-full top-2 ml-2 z-[90] w-[250px] max-h-[calc(100vh-1rem)]
                                overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#16181f] py-2
                                shadow-[0_16px_40px_rgba(0,0,0,0.4)] [scrollbar-width:thin]'>

                            {flyout === "search" && (
                                <div className='px-2 pb-1'>
                                    <input
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder='Search chats...'
                                        className='w-full px-2.5 py-2 rounded-lg bg-white/[0.06] text-[14px]
                                            text-slate-100 outline-none placeholder:text-slate-500' />
                                </div>
                            )}

                            <div className='px-3.5 pt-1 pb-1.5 text-[13px] text-slate-500'>
                                {flyoutTitle}
                            </div>

                            <div className='px-1.5'>
                                {flyoutList.length === 0 ? (
                                    <div className='px-2 py-2 text-[13px] text-slate-500'>
                                        {flyout === "search"
                                            ? (searchQuery ? "No results" : "Type to search your chats")
                                            : flyout === "pinned" ? "No pinned chats" : "No recent chats"}
                                    </div>
                                ) : (
                                    flyoutList.map((conv) => {
                                        const isActive = selectedConversation?._id === conv._id
                                        return (
                                            <div key={conv._id} onClick={() => selectFromFlyout(conv)}
                                                title={conv?.title || "New Chat"}
                                                className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer
                                                    text-[14px] transition-colors duration-150 hover:bg-white/[0.05]
                                                    ${isActive ? "bg-white/[0.06] text-slate-100" : "text-slate-300"}`}>
                                                {flyout === "pinned" && <Pin size={13} className='shrink-0 text-slate-500' />}
                                                <span className='truncate'>{conv?.title || "New Chat"}</span>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </>
                )}

                <BillingDrawer
                    open={showBilling}
                    onClose={() => setShowBilling(false)}
                />
            </div>
            </>
        )
    }

    return (
        <>
        {mobileControls}

        <div className={`fixed lg:static inset-y-0 left-0 z-50 w-[270px] h-screen shrink-0
            bg-[#0d0f14] border-r border-white/[0.06] transition-transform duration-200
            ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        
            <div className='flex flex-col h-full'>
                {/* ── Fixed header ── */}
                <div className='shrink-0 flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.60]'>
                    <button className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-500
                        hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150
                        bg-transparent border-none cursor-pointer'
                        title='Collapse sidebar'
                        onClick={() => setCollapsed(true)} >
                        <PanelLeftIcon size={16} />
                    </button>

                    {/* Mobile: close the drawer */}
                    <button onClick={() => setMobileOpen(false)}
                        className='lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-slate-500
                            hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150
                            bg-transparent border-none cursor-pointer'
                        title='Close sidebar'>
                        <X size={16} />
                    </button>

                    <span className='text-[16px] font-semibold text-slate-100 tracking-tight flex-1'>
                        MultivexAI
                    </span>

                    <span className='text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border
                        border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide'>
                        {userData?.plan || "Free"}
                    </span>
                    <button className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-500
                        hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent
                        border-none cursor-pointer' title='New chat' onClick={()=> { dispatch(resetChat()); dispatch(setSelectedConversation(null)); setMobileOpen(false) }}>
                        <PenSquare size={14} />
                    </button>
                </div>

                {/* ── Fixed: New Chat + section label ── */}
                <div className='shrink-0 px-4 pt-4 pb-1'>
                    <button className='w-full flex items-center justify-center gap-2 text-sm font-medium text-white
                    bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl py-[10px] border-none cursor-pointer
                    hover:opacity-90 transition-opacity duration-150' onClick={()=> { dispatch(resetChat()); dispatch(setSelectedConversation(null)); setMobileOpen(false) }}>
                        <Plus size={15} />
                        New Chat
                    </button>

                    {visibleConversations.length === 0
                        ?
                        <div className='px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest
                            text-slate-600'>
                            No Recent Conversations
                        </div>
                        :
                        (
                            <div className='px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest
                            text-slate-600'>
                                Recents
                            </div>
                        )}
                </div>

                {/* ── Scrollable conversation list (this is the ONLY part that scrolls) ── */}
                <div
                    onScroll={() => { if (menu) setMenu(null) }}
                    className='flex-1 min-h-0 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                    {visibleConversations.map((conv) => {
                        const isActive = selectedConversation?._id === conv?._id
                        const isRenaming = renamingId === conv._id
                        return (
                            <div onClick={() => { dispatch(resetChat()); dispatch(setSelectedConversation(conv)); setMobileOpen(false) }}
                                key={conv._id} className={`group flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px]
                                border transition-colors duration-150 ${isActive ?
                                        "bg-indigo-500/10 border-indigo-500/[0.18]" :
                                        "bg-transparent border-transparent hover:bg-white/[0.04]"}`}>

                                <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg
                                transition-colors duration-150 ${isActive ?
                                        "bg-indigo-500/15 text-indigo-400" :
                                        "bg-white/[0.05] text-slate-500"}`}>

                                    <MessageSquare size={13} />
                                </div>

                                {isRenaming ? (
                                    <input
                                        autoFocus
                                        value={renameValue}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") commitRename(conv)
                                            else if (e.key === "Escape") setRenamingId(null)
                                        }}
                                        onBlur={() => commitRename(conv)}
                                        className='flex-1 min-w-0 bg-white/[0.06] border border-indigo-500/40 rounded-md
                                            px-2 py-1 text-[13px] text-slate-100 outline-none' />
                                ) : (
                                    <span className={`flex-1 min-w-0 text-[13px] font-medium truncate ${isActive ?
                                        "text-slate-100" : "text-slate-300"}`}>
                                        {conv?.title || "New Chat"}
                                    </span>
                                )}

                                {conv?.pinned && !isRenaming && (
                                    <Pin size={11} className='shrink-0 text-indigo-400' />
                                )}

                                {!isRenaming && (
                                    <button
                                        onClick={(e) => openMenu(e, conv)}
                                        title='More options'
                                        className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-md bg-transparent
                                            border-none cursor-pointer transition-all duration-150 ${menu?.id === conv._id ?
                                                "opacity-100 text-slate-200 bg-white/[0.1]" :
                                                "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 hover:bg-white/[0.1]"}`}>
                                        <MoreHorizontal size={15} />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* ── Fixed footer: user controls — always visible, never scrolls ── */}
                <div className='shrink-0 border-t border-white/[0.08] bg-[#0b0d12] px-3 py-3'>
                    {profileControls}
                </div>
            </div>

            {menu && (() => {
                const conv = conversations.find(c => c?._id === menu.id)
                if (!conv) return null
                return (
                    <>
                        <div className='fixed inset-0 z-[80]' onClick={() => setMenu(null)} />
                        <div
                            style={{ top: menu.top, left: menu.left }}
                            className='fixed z-[90] w-[176px] py-1.5 rounded-xl border border-white/[0.08]
                                bg-[#16181f] shadow-xl shadow-black/40'>
                            <button className={`${menuItemCls} text-slate-300 hover:bg-white/[0.06] hover:text-slate-100`}
                                onClick={() => handleShare(conv)}>
                                <Share size={14} /> Share
                            </button>
                            <button className={`${menuItemCls} text-slate-300 hover:bg-white/[0.06] hover:text-slate-100`}
                                onClick={() => handleRename(conv)}>
                                <Pencil size={14} /> Rename
                            </button>
                            <div className='my-1 mx-2.5 h-px bg-white/[0.07]' />
                            <button className={`${menuItemCls} text-slate-300 hover:bg-white/[0.06] hover:text-slate-100`}
                                onClick={() => handleTogglePin(conv)}>
                                <Pin size={14} /> {conv?.pinned ? "Unpin" : "Pin chat"}
                            </button>
                            <button className={`${menuItemCls} text-slate-300 hover:bg-white/[0.06] hover:text-slate-100`}
                                onClick={() => handleArchive(conv)}>
                                <Archive size={14} /> Archive
                            </button>
                            <button className={`${menuItemCls} text-rose-400 hover:bg-rose-500/10 hover:text-rose-300`}
                                onClick={() => handleDelete(conv)}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </>
                )
            })()}
        </div>
        <BillingDrawer
                open={showBilling}
                onClose={() => setShowBilling(false)}
            />
        </>
    )
}

export default SideBar