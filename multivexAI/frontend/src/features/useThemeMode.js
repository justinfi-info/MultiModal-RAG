import { useEffect, useState } from "react"

// Single source of truth is the `light-mode` class that ThemeToggle toggles
// on <html>. Observing that class lets any component (Monaco editor, syntax
// highlighter, ...) react instantly to the light/dark toggle without needing
// a global context refactor, and re-syncs if the preference changes elsewhere.
const getIsLight = () =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light-mode")

function useThemeMode() {
    const [isLight, setIsLight] = useState(getIsLight)

    useEffect(() => {
        if (typeof document === "undefined" || typeof MutationObserver === "undefined") return undefined
        const observer = new MutationObserver(() => setIsLight(getIsLight()))
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
        return () => observer.disconnect()
    }, [])

    return isLight
}

export default useThemeMode