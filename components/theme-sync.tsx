'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export function ThemeSync({ forcedTheme }: { forcedTheme: string | null }) {
    const { setTheme, theme } = useTheme()

    useEffect(() => {
        if (forcedTheme && ['light', 'dark', 'system'].includes(forcedTheme)) {
            setTheme(forcedTheme)
        }
    }, [forcedTheme, setTheme])

    return null
}
