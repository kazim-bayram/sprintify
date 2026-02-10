// =============================================================================
// Sprintify NPD — Application Constants
// FMCG New Product Development Agile Platform
// =============================================================================

export const APP_NAME = "Sprintify NPD";

// Default board columns for new projects (NPD pipeline)
export const DEFAULT_BOARD_COLUMNS = [
  { name: "Backlog", position: 0 },
  { name: "To Do", position: 1 },
  { name: "In Progress", position: 2 },
  { name: "Evaluation / Lab", position: 3 },
  { name: "Done", position: 4 },
] as const;

// RBAC roles
export const ROLES = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

// Departments (FMCG cross-functional teams)
export const DEPARTMENTS = [
  { value: "MARKETING", label: "Marketing", color: "#22C55E", shortLabel: "MKT" },
  { value: "R_AND_D", label: "R&D (ÜrGe)", color: "#3B82F6", shortLabel: "R&D" },
  { value: "PACKAGING", label: "Packaging (Ambalaj)", color: "#F97316", shortLabel: "PKG" },
  { value: "QUALITY", label: "Quality", color: "#EF4444", shortLabel: "QA" },
  { value: "SUPPLY_CHAIN", label: "Supply Chain", color: "#8B5CF6", shortLabel: "SC" },
  { value: "FINANCE", label: "Finance", color: "#EAB308", shortLabel: "FIN" },
] as const;

export type DepartmentValue = (typeof DEPARTMENTS)[number]["value"];

// Priority levels for stories
export const PRIORITIES = [
  { value: "URGENT", label: "Urgent", color: "destructive" },
  { value: "HIGH", label: "High", color: "orange" },
  { value: "MEDIUM", label: "Medium", color: "yellow" },
  { value: "LOW", label: "Low", color: "blue" },
  { value: "NONE", label: "None", color: "secondary" },
] as const;

// Story points (Fibonacci — used as Job Size in WSJF)
export const STORY_POINTS = [1, 2, 3, 5, 8, 13] as const;

// WSJF scale (1-10 for value, criticality, risk)
export const WSJF_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * Calculate WSJF Score
 * WSJF = (User/Business Value + Time Criticality + Risk Reduction) / Job Size
 */
export function calculateWSJF(
  userBusinessValue: number,
  timeCriticality: number,
  riskReduction: number,
  jobSize: number
): number {
  if (jobSize <= 0) return 0;
  return Math.round(((userBusinessValue + timeCriticality + riskReduction) / jobSize) * 10) / 10;
}

// Story statuses matching default board columns
export const STORY_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "EVALUATION",
  "DONE",
] as const;

export type StoryStatus = (typeof STORY_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number]["value"];
export type StoryPoint = (typeof STORY_POINTS)[number];

// Sprint statuses
export const SPRINT_STATUSES = ["PLANNING", "ACTIVE", "CLOSED"] as const;
export type SprintStatusType = (typeof SPRINT_STATUSES)[number];

// Default sprint duration in days
export const DEFAULT_SPRINT_DURATION_DAYS = 14;

// Checklist types for Quality Gates
export const CHECKLIST_TYPES = {
  DOR: "DOR", // Definition of Ready
  DOD: "DOD", // Definition of Done
} as const;

// Default DoR items for new stories
export const DEFAULT_DOR_ITEMS = [
  "Brief approved by stakeholders",
  "Acceptance criteria defined",
  "Dependencies identified",
] as const;

// Default DoD items for new stories
export const DEFAULT_DOD_ITEMS = [
  "All tasks completed",
  "Lab results documented",
  "Regulatory check passed",
  "Stakeholder sign-off received",
] as const;
