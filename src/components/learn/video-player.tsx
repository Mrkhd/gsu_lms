"use client"

import * as React from "react"
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const thumbClasses =
  "[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary"

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)
  return `${minutes}:${String(rest).padStart(2, "0")}`
}

export function VideoPlayer({ src, title }: { src: string; title: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = React.useState(false)
  const [current, setCurrent] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(1)
  const [muted, setMuted] = React.useState(false)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const togglePlay = React.useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play().catch(() => setError(true))
    } else {
      video.pause()
    }
  }, [])

  const seek = (value: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = value
    setCurrent(value)
  }

  const changeVolume = (value: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = value
    video.muted = value === 0
    setVolume(value)
    setMuted(value === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    const next = !video.muted
    video.muted = next
    setMuted(next)
  }

  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await container.requestFullscreen()
    } catch {
      // Fullscreen may be blocked; ignore.
    }
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === " " || event.key === "k") {
      event.preventDefault()
      togglePlay()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      seek(Math.min(duration, current + 5))
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      seek(Math.max(0, current - 5))
    } else if (event.key === "m") {
      toggleMute()
    } else if (event.key === "f") {
      void toggleFullscreen()
    }
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-xl bg-black ring-1 ring-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label={title}
    >
      <video
        ref={videoRef}
        src={src}
        title={title}
        preload="metadata"
        playsInline
        className="aspect-video w-full"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0)
          setVolume(event.currentTarget.volume)
          setMuted(event.currentTarget.muted)
        }}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume)
          setMuted(event.currentTarget.muted)
        }}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
      />

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-white">
          Video unavailable. Please try again later.
        </div>
      ) : null}

      {!playing && !error ? (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
            <Play className="size-7 translate-x-0.5" />
          </span>
        </button>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2 transition-opacity",
          playing
            ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            : "opacity-100"
        )}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="Seek"
          className={cn("h-1.5 w-full cursor-pointer appearance-none rounded-full", thumbClasses)}
          style={{
            background: `linear-gradient(to right, var(--primary) ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
          }}
        />
        <div className="mt-1 flex items-center gap-1 text-white">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <span className="text-xs tabular-nums">
            {formatTime(current)} / {formatTime(duration)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </Button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              aria-label="Volume"
              className={cn(
                "hidden h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 sm:block",
                thumbClasses
              )}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => void toggleFullscreen()}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
