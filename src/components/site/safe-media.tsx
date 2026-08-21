import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/media/placeholder.svg";
const VIDEO_POSTER_FALLBACK = PLACEHOLDER;
const MAX_RETRIES = 3;

function withRetryParam(src: string, attempt: number): string {
  if (attempt === 0) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}media_retry=${attempt}`;
}

function mediaTypeFromUrl(src: string): string | undefined {
  const path = src.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".mp4")) return "video/mp4";
  if (path.endsWith(".webm")) return "video/webm";
  if (path.endsWith(".mov")) return "video/quicktime";
  return undefined;
}

export function SafeImage({
  src,
  alt,
  className,
  imgClassName,
  fallback = PLACEHOLDER,
  loading = "lazy",
  fetchPriority = "auto",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const url = !src || failed ? fallback : withRetryParam(src, attempt);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    setAttempt(0);
  }, [src, fallback]);

  return (
    <div className={cn("relative overflow-hidden bg-navy-mid", className)}>
      <img
        key={url}
        src={url}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={cn(
          "relative h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/20 transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (src && !failed && attempt < MAX_RETRIES) {
            if (attempt === 0) {
              setFailed(true);
              return;
            }
            window.setTimeout(() => setAttempt((value) => value + 1), 500 * (attempt + 1));
            return;
          }
          setFailed(true);
          setLoaded(false);
        }}
      />
    </div>
  );
}

export function SafeVideo({
  src,
  poster,
  className,
  caption,
  frameIndex = 0,
  preview = false,
}: {
  src: string;
  poster?: string | null;
  className?: string;
  caption?: string | null;
  frameIndex?: number;
  preview?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const effectivePoster = poster || VIDEO_POSTER_FALLBACK;

  useEffect(() => {
    setFailed(false);
    setAttempt(0);
    setPlaying(false);
  }, [src, poster, frameIndex, preview]);

  if (!src) {
    return (
      <div className={cn("relative bg-navy-mid", className)}>
        <SafeImage src={effectivePoster} alt={caption || "Video unavailable"} className="h-full w-full" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className={cn("relative bg-navy-mid", className)}>
        <SafeImage src={effectivePoster} alt={caption || "Video unavailable"} className="h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-navy/80 px-4 py-3 text-sm text-fg">
          Video could not be loaded. The still image is shown instead.
        </div>
      </div>
    );
  }

  const url = withRetryParam(src, attempt);
  const type = mediaTypeFromUrl(src);

  return (
    <div className={cn("relative bg-navy", className)}>
      <video
        key={url}
        controls={preview ? false : playing}
        muted={!playing}
        playsInline
        preload="none"
        poster={effectivePoster}
        className="h-full w-full bg-navy object-contain"
        onError={() => {
          if (attempt < MAX_RETRIES) {
            window.setTimeout(() => setAttempt((value) => value + 1), 700 * (attempt + 1));
            return;
          }
          setFailed(true);
        }}
        onClick={(event) => {
          if (preview) return;
          const video = event.currentTarget;
          video.muted = false;
          setPlaying(true);
          void video.play().catch(() => undefined);
        }}
      >
        <source src={url} type={type} />
        {type !== "video/mp4" ? <source src={url} type="video/mp4" /> : null}
      </video>
      {!preview && !playing ? (
        <button
          type="button"
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-transparent"
          onClick={(event) => {
            event.stopPropagation();
            const video = event.currentTarget.previousElementSibling as HTMLVideoElement | null;
            if (video) {
              video.muted = false;
              setPlaying(true);
              void video.play().catch(() => undefined);
            }
          }}
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition-transform hover:scale-105">
            <span className="ml-1 text-3xl">▶</span>
          </span>
        </button>
      ) : null}
      {preview ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white shadow-lg">
            <span className="ml-1 text-2xl">▶</span>
          </span>
        </div>
      ) : null}
      {caption ? <p className="border-t border-line bg-paper px-3 py-2 text-sm text-steel">{caption}</p> : null}
    </div>
  );
}
