import { useLayoutEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import "../lightMode.css"

const THEME_KEY = "multivex-theme"

// Dark is the default so the app looks exactly as it does today
// until the user opts into light mode.
const getInitialTheme = () => {
    try {
        return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"
    } catch {
        return "dark"
    }
}

function ThemeToggle() {
    const [theme, setTheme] = useState(getInitialTheme)

    // useLayoutEffect applies the class before paint, so there is no
    // dark flash when reloading in light mode.
    useLayoutEffect(() => {
        document.documentElement.classList.toggle("light-mode", theme === "light")
        try {
            localStorage.setItem(THEME_KEY, theme)
        } catch { /* storage unavailable (private mode etc.) — toggle still works */ }
    }, [theme])

    const isLight = theme === "light"

    return (
        <button
            type="button"
            onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
            title={isLight ? "Switch to dark mode" : "Switch to light mode"}
            className="fixed top-3 right-3 lg:right-[60px] z-[45] flex items-center justify-center w-9 h-9 rounded-lg
                bg-white/[0.05] border border-white/[0.08] text-slate-300 cursor-pointer
                hover:bg-white/[0.1] transition-colors duration-150">
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>
    )
}

export default ThemeToggle
