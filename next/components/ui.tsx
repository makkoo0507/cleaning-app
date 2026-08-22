// 共通 UI コンポーネント（管理 Web 全体で再利用）
// PrimaryLink は useLinkStatus (クライアント専用) に依存する components/Link.tsx を使うため
// components/PrimaryLink.tsx に分離（このファイルは Server Component から import されるため）

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export function Field({
  label,
  required,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function TextInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${className}`} />;
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${className}`} />;
}

export function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${className}`} />;
}

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      {action}
    </div>
  );
}

export function SpinnerIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
      />
    </svg>
  );
}

// ボタンのローディング表示用。pending 時にラベルの前へスピナーを添える。
export function PendingLabel({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {pending && <SpinnerIcon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

export function Spinner({ label = "読み込み中" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-16 text-sm text-zinc-500 dark:text-zinc-400">
      <SpinnerIcon className="h-5 w-5 text-zinc-400" />
      {label}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-zinc-300 px-4 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700">
      {children}
    </p>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </span>
  );
}

type AlertVariant = "warning" | "error" | "success";

const ALERT_BOX_STYLES: Record<AlertVariant, string> = {
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  success:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
};

const ALERT_INLINE_STYLES: Record<AlertVariant, string> = {
  warning: "text-amber-700 dark:text-amber-400",
  error: "text-red-600",
  success: "text-green-600",
};

export function Alert({
  variant,
  inline = false,
  className = "",
  children,
}: {
  variant: AlertVariant;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const role = variant === "error" ? "alert" : undefined;

  if (inline) {
    return (
      <p className={`text-sm ${ALERT_INLINE_STYLES[variant]} ${className}`} role={role}>
        {children}
      </p>
    );
  }

  return (
    <div
      role={role}
      className={`rounded-md border px-4 py-3 text-sm ${ALERT_BOX_STYLES[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

export function Card({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
