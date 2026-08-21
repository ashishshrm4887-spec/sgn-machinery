import { createFileRoute } from "@tanstack/react-router";
import { listPublishedGallery } from "@/lib/server/site";
import { SafeImage, SafeVideo } from "@/components/site/safe-media";

export const Route = createFileRoute("/_public/gallery")({
  loader: () => listPublishedGallery(),
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: "Gallery | Shree Guru Nanak Dev Machinery Company" },
      {
        name: "description",
        content: "Workshop, machinery, and project photographs from Shree Guru Nanak Dev Machinery Company.",
      },
    ],
  }),
});

function GalleryPage() {
  const items = Route.useLoaderData();
  let videoIndex = 0;

  return (
    <>
      <header className="bg-navy py-16 text-fg">
        <div className="mx-auto max-w-6xl px-4">
          <p className="kicker">Media</p>
          <h1 className="mt-3 font-display text-5xl uppercase">Gallery</h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Photographs from the Amritsar workshop. Additional images can be uploaded from the administrator panel.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-14">
        {items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const currentVideoIndex = item.kind === "video" ? videoIndex++ : 0;
              return (
                <figure key={item.id} className="bg-navy">
                  {item.kind === "video" ? (
                    <SafeVideo
                      src={item.url}
                      poster={item.posterUrl}
                      frameIndex={currentVideoIndex}
                      className="aspect-[4/3]"
                    />
                  ) : (
                    <SafeImage src={item.url} alt={item.caption || "Gallery image"} className="aspect-[4/3]" />
                  )}
                  {item.caption || item.category ? (
                    <figcaption className="px-3 py-2 text-sm text-fg-muted">
                      {item.category ? <span className="mr-2 text-accent">{item.category}</span> : null}
                      {item.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        ) : (
          <p className="text-steel">Gallery images will appear here after they are uploaded and published.</p>
        )}
      </div>
    </>
  );
}
