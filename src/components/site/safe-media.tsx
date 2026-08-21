import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/media/placeholder.svg";
const VIDEO_POSTER_FALLBACK = "/media/hero-workshop.jpg";
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
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const url = !src || failed ? fallback : withRetryParam(src, attempt);

  return (
    <div className={cn("relative overflow-hidden bg-navy-mid", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-navy-lift/80" aria-hidden />
      )}
      <img
        key={url}
        src={url}
        alt={alt}
        loading="lazy"
        className={cn(
          "h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/20 transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (src && !failed && attempt < MAX_RETRIES) {
            window.setTimeout(() => {
              setAttempt((value) => value + 1);
            }, 500 * (attempt + 1));
            return;
          }
          setFailed(true);
          setLoaded(true);
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
}: {
  src: string;
  poster?: string | null;
  className?: string;
  caption?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const effectivePoster = poster || generatedPoster || VIDEO_POSTER_FALLBACK;

  useEffect(() => {
    if (!src || poster) {
      setGeneratedPoster(null);
      return;
    }

    let cancelled = false;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const captureFrame = () => {
      if (cancelled || !video.videoWidth || !video.videoHeight) return;

      const canvas = document.createElement("canvas");
      const maxWidth = 640;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

      const context = canvas.getContext("2d");
      if (!context) return;

      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        if (dataUrl.length > 100) setGeneratedPoster(dataUrl);
      } catch {
        // Cross-origin or unsupported media: keep the normal fallback poster.
      }

      video.removeAttribute("src");
      video.load();
    };

    const onLoadedData = () => captureFrame();
    const onSeeked = () => captureFrame();

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.src = withRetryParam(src, 0);

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeAttribute("src");
      video.load();
    };
  }, [src, poster]);

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
        controls
        playsInline
        preload="metadata"
        poster={effectivePoster}
        className="h-full w-full bg-navy object-contain"
        onError={() => {
          if (attempt < MAX_RETRIES) {
            window.setTimeout(() => {
              setAttempt((value) => value + 1);
            }, 700 * (attempt + 1));
            return;
          }
          setFailed(true);
        }}
      >
        <source src={url} type={type} />
        {type !== "video/mp4" ? <source src={url} type="video/mp4" /> : null}
      </video>
      {caption ? (
        <p className="border-t border-line bg-paper px-3 py-2 text-sm text-steel">{caption}</p>
      ) : null}
    </div>
  );
}
