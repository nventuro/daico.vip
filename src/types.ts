/** A household member authorized to access the app (allowlisted by email). */
export interface Member {
  email: string;
  display_name: string;
}

/** A chore / task to be done. */
export interface Chore {
  id: number;
  title: string;
  notes: string | null;
  done: boolean;
  /** Optional due date as an ISO date string (yyyy-mm-dd). */
  due_on: string | null;
  created_at: string;
}
