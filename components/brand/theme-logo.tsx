"use client"

import Image from "next/image"
import { useTheme } from "next-themes"

export function ThemeLogo({ size = 24, className = "" }: { size?: number; className?: string }) {
  const { resolvedTheme } = useTheme()
  const source = resolvedTheme === "dark" ? "/logo_p_white.svg" : "/logo_p_black.svg"

  return (
    <Image
      src={source}
      alt="Logo Papirar"
      width={size}
      height={size}
      className={className}
    />
  )
}
