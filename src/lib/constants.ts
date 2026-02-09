// =============================================================================
// Sprintify - Application Constants
// =============================================================================

export const APP_NAME = "Sprintify";

// Default board columns for new projects (semi-fixed, renameable)
export const DEFAULT_BOARD_COLUMNS = [
  { name: "Backlog", position: 0 },
  { name: "To Do", position: 1 },
  { name: "In Progress", position: 2 },
  { name: "Review", position: 3 },
  { name: "Done", position: 4 },
] as const;

// RBAC roles
export const ROLES = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

// Ticket priorities (stored in metadata JSONB)
export const PRIORITIES = [
  { value: "URGENT", label: "Urgent", color: "destructive" },
  { value: "HIGH", label: "High", color: "orange" },
  { value: "MEDIUM", label: "Medium", color: "yellow" },
  { value: "LOW", label: "Low", color: "blue" },
  { value: "NONE", label: "None", color: "secondary" },
] as const;

// Story points (Fibonacci)
export const STORY_POINTS = [1, 2, 3, 5, 8] as const;

// T-shirt sizes mapped to story points
export const TSHIRT_SIZES = [
  { value: "S", label: "Small", points: 1 },
  { value: "M", label: "Medium", points: 3 },
  { value: "L", label: "Large", points: 5 },
] as const;

// Ticket statuses matching default board columns
export const TICKET_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number]["value"];
export type StoryPoint = (typeof STORY_POINTS)[number];

// Sprint statuses
export const SPRINT_STATUSES = ["PLANNING", "ACTIVE", "CLOSED"] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

// Default sprint duration in days
export const DEFAULT_SPRINT_DURATION_DAYS = 14;
