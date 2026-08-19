import { useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/media/placeholder.svg";

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
  const url = !src || failed ? fallback : src;
  return (
    <div className={cn("relative overflow-hidden bg-navy-mid", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-navy-lift/80" aria-hidden />
      )}
      <img
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
  if (failed) {
    return (
      <div className={cn("relative bg-navy-mid", className)}>
        <SafeImage src={poster} alt={caption || "Video unavailable"} className="h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-navy/80 px-4 py-3 text-sm text-fg">
          Video could not be loaded. The still image is shown instead.
        </div>
      </div>
    );
  }
  return (
    <div className={cn("relative bg-navy", className)}>
      <video
        controls
        preload="none"
        poster={poster || PLACEHOLDER}
        className="h-full w-full bg-navy"
        onError={() => setFailed(true)}
      >
        <source src={src} />
      </video>
    </div>
  );
}
