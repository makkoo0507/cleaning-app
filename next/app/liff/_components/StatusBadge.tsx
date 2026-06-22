import type { JobStatus } from "@/lib/database.types";
import { JOB_STATUS_LABEL } from "@/lib/database.types";

const STYLES: Record<JobStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? STYLES.scheduled}`}
    >
      {JOB_STATUS_LABEL[status] ?? "予定"}
    </span>
  );
}
