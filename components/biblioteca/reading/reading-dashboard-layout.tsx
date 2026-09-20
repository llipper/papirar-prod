"use client"

import React, { type ReactNode } from "react"
import { BookOpen, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import type { LawReading } from "@/lib/biblioteca/reading-service"
import {
  ReadingAudioProvider,
  useReadingAudio,
} from "@/lib/biblioteca/reading-audio-context"
import type { ReadingAudioQueueItem } from "@/lib/biblioteca/reading-audio-context"
import { ReadingFloatingAudioPlayer } from "./audio/reading-floating-audio-player"
import {
  ReadingDashboardHeader,
  type ReadingFontScale,
} from "./reading-dashboard-header"

export interface ReadingDashboardLayoutProps {
  children: ReactNode
  reading?: LawReading | null
  isIndexOpen?: boolean
  onIndexOpenChange?: (open: boolean) => void
  readingProgress?: number
  fontScale?: ReadingFontScale
  onFontScaleChange?: (scale: ReadingFontScale) => void
  audioQueue?: ReadingAudioQueueItem[]
}

function ReadingDashboardFrame({
  children,
  reading,
  onIndexOpenChange,
  readingProgress,
  fontScale,
  onFontScaleChange,
}: {
  children: ReactNode
  reading?: LawReading | null
  onIndexOpenChange?: (open: boolean) => void
  readingProgress?: number
  fontScale?: ReadingFontScale
  onFontScaleChange?: (scale: ReadingFontScale) => void
}) {
  const { isMobile, state } = useSidebar()
  const { currentAudio } = useReadingAudio()
  const progressBarLeft =
    isMobile || state === "collapsed"
      ? "1rem"
      : "calc(var(--sidebar-width) + 1.25rem)"

  return (
    <>
      <AppSidebar />
      <SidebarInset className="h-svh max-h-svh min-w-0 overflow-hidden flex flex-col">
        <ReadingDashboardHeader
          reading={reading}
          onOpenIndex={() => onIndexOpenChange?.(true)}
          fontScale={fontScale}
          onFontScaleChange={onFontScaleChange}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden relative">
          {children}
        </div>
        <ReadingFloatingAudioPlayer />
        {reading && !isMobile && (
          <div
            className={`pointer-events-none fixed z-30 px-4 transition-all duration-300 ${
              currentAudio ? "bottom-24" : "bottom-5"
            }`}
            style={{ left: progressBarLeft }}
          >
            <div className="pointer-events-auto flex h-[44px] w-[166px] min-w-[166px] shrink-0 items-center gap-1 rounded-[18px] bg-black p-1.5 text-white shadow-lg dark:bg-white dark:text-black">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 min-w-[104px] shrink-0 rounded-xl px-3 font-heading text-xs font-bold whitespace-nowrap text-inherit hover:bg-white/15 hover:text-inherit dark:hover:bg-black/10"
                onClick={() => onIndexOpenChange?.(true)}
              >
                <BookOpen className="size-4" />
                Índice
                <ChevronsUpDown className="size-3.5 opacity-75" />
              </Button>
              <span className="min-w-[42px] shrink-0 rounded-[10px] bg-white/20 px-2.5 py-1 text-center font-heading text-xs font-bold dark:bg-black/15">
                {readingProgress ?? 1}%
              </span>
            </div>
          </div>
        )}
      </SidebarInset>
    </>
  )
}

export function ReadingDashboardLayout({
  children,
  reading,
  isIndexOpen = false,
  onIndexOpenChange,
  readingProgress,
  fontScale,
  onFontScaleChange,
  audioQueue,
}: ReadingDashboardLayoutProps) {
  return (
    <ReadingAudioProvider audioQueue={audioQueue}>
      <SidebarProvider className="h-svh min-h-0 overflow-hidden">
        <ReadingDashboardFrame
          reading={reading}
          onIndexOpenChange={onIndexOpenChange}
          readingProgress={readingProgress}
          fontScale={fontScale}
          onFontScaleChange={onFontScaleChange}
        >
          {children}
        </ReadingDashboardFrame>
      </SidebarProvider>
    </ReadingAudioProvider>
  )
}
