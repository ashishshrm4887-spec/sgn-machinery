import { createFileRoute } from "@tanstack/react-router";
import { emptyMachine, MachineForm } from "@/components/admin/machine-form";

export const Route = createFileRoute("/admin/machines/new")({
  component: () => (
    <div>
      <h1 className="mb-6 font-display text-4xl uppercase">Add machine</h1>
      <MachineForm initial={emptyMachine()} />
    </div>
  ),
});
