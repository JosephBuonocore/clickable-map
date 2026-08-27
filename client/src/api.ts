import type { Assignments, Category } from "./types";

export interface SubmitResult {
  id: string;
  name: string;
  submittedAt: string;
}

export async function submitEntry(
  name: string,
  categories: Category[],
  assignments: Assignments,
): Promise<SubmitResult> {
  const res = await fetch("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, categories, assignments }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Submission failed (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchSubmissionCount(): Promise<number> {
  const res = await fetch("/api/submissions/count");
  if (!res.ok) return 0;
  const data = await res.json();
  return typeof data.count === "number" ? data.count : 0;
}
