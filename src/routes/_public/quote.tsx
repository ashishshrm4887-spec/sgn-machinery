import { createFileRoute } from "@tanstack/react-router";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { listMachineOptions } from "@/lib/server/site";

export const Route = createFileRoute("/_public/quote")({
  validateSearch: (s: Record<string, unknown>): { machine?: string } => {
    if (typeof s.machine === "string" && s.machine.trim()) {
      return { machine: s.machine };
    }
    return {};
  },
  loader: () => listMachineOptions(),
  component: QuotePage,
  head: () => ({
    meta: [
      { title: "Request a Quote | Shree Guru Nanak Dev Machinery Company" },
      {
        name: "description",
        content: "Request a quotation for corrugated board and allied machinery.",
      },
    ],
  }),
});

function QuotePage() {
  const machines = Route.useLoaderData();
  const { machine } = Route.useSearch();
  return (
    <>
      <header className="bg-navy py-16 text-fg">
        <div className="mx-auto max-w-6xl px-4">
          <p className="kicker">Quotation</p>
          <h1 className="mt-3 font-display text-5xl uppercase">Request a quote</h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Share the machine, quantity, and any reference drawings or photographs. The company will respond with
            confirmed details.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-14">
        <div className="bg-paper-2 p-6 sm:p-8">
          <EnquiryForm kind="quote" machines={machines} defaultMachine={machine} />
        </div>
      </div>
    </>
  );
}
