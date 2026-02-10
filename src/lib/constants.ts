// =============================================================================
// Sprintify — Application Constants
// Hybrid Project Management Platform (Agile + Waterfall)
// =============================================================================

export const APP_NAME = "Sprintify";

// Default Sprint Board columns for new projects
export const DEFAULT_SPRINT_COLUMNS = [
  { name: "Backlog", position: 0, colType: "BACKLOG" as const, boardType: "SPRINT_BOARD" as const },
  { name: "To Do", position: 1, colType: "TODO" as const, boardType: "SPRINT_BOARD" as const },
  { name: "In Progress", position: 2, colType: "DOING" as const, boardType: "SPRINT_BOARD" as const },
  { name: "Evaluation / Lab", position: 3, colType: "DOING" as const, boardType: "SPRINT_BOARD" as const },
  { name: "Done", position: 4, colType: "DONE" as const, boardType: "SPRINT_BOARD" as const },
] as const;

// Default Product Backlog columns for new projects
export const DEFAULT_BACKLOG_COLUMNS = [
  { name: "New Ideas", position: 0, colType: "BACKLOG" as const, boardType: "GLOBAL_PRODUCT_BACKLOG" as const },
  { name: "Grooming", position: 1, colType: "TODO" as const, boardType: "GLOBAL_PRODUCT_BACKLOG" as const },
  { name: "Ready for Sprint", position: 2, colType: "DONE" as const, boardType: "GLOBAL_PRODUCT_BACKLOG" as const },
] as const;

// Combined for project creation
export const DEFAULT_BOARD_COLUMNS = [...DEFAULT_SPRINT_COLUMNS, ...DEFAULT_BACKLOG_COLUMNS];

// Column system types (for mapping)
export const COLUMN_TYPES = [
  { value: "BACKLOG", label: "Backlog", description: "Incoming / unplanned work" },
  { value: "TODO", label: "To Do", description: "Planned but not started" },
  { value: "DOING", label: "In Progress", description: "Active work" },
  { value: "DONE", label: "Done", description: "Completed work" },
] as const;

export const BOARD_TYPES = [
  { value: "SPRINT_BOARD", label: "Sprint Board" },
  { value: "GLOBAL_PRODUCT_BACKLOG", label: "Product Backlog" },
] as const;

// Custom field types
export const FIELD_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "SELECT", label: "Dropdown" },
  { value: "DATE", label: "Date" },
  { value: "USER", label: "User Picker" },
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

// =============================================================================
// Planning Poker / Value & Effort Workshop
// =============================================================================

// Fibonacci voting cards
export const POKER_CARDS = [1, 2, 3, 5, 8, 13, 20] as const;
export type PokerCard = (typeof POKER_CARDS)[number];

// Voting type labels
export const VOTING_TYPES = [
  { value: "EFFORT", label: "Story Points", description: "Effort / Job Size", field: "jobSize" },
  { value: "VALUE", label: "Business Value", description: "User / Business Value", field: "userBusinessValue" },
  { value: "TIME", label: "Time Criticality", description: "Time Criticality", field: "timeCriticality" },
  { value: "RISK", label: "Risk Reduction", description: "Risk Reduction / Opportunity", field: "riskReduction" },
] as const;
export type VotingTypeValue = (typeof VOTING_TYPES)[number]["value"];

/** Generate a 6-char alphanumeric access code */
export function generateAccessCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Generate a human-friendly 6-char join code for organizations, e.g. "ETI-9X" */
export function generateJoinCode(seed: string): string {
  const base = (seed || "TEAM").replace(/[^A-Za-z]/g, "").toUpperCase() || "TEAM";
  const prefix = base.slice(0, 3).padEnd(3, "X");
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  return `${prefix}-${random}`;
}

// =============================================================================
// Project Methodology / Hybrid Project Engine
// =============================================================================

export const METHODOLOGIES = [
  { value: "AGILE", label: "Agile", description: "Sprints, Backlogs, Velocity", icon: "Kanban" },
  { value: "WATERFALL", label: "Waterfall", description: "Gantt, Phases, Milestones", icon: "GanttChart" },
  { value: "HYBRID", label: "Hybrid", description: "Phases containing Sprints", icon: "Layers" },
] as const;
export type MethodologyValue = (typeof METHODOLOGIES)[number]["value"];

// Default phases for Waterfall/Hybrid projects
export const DEFAULT_WATERFALL_PHASES = [
  { name: "Feasibility", color: "#3B82F6", position: 0 },
  { name: "Development", color: "#22C55E", position: 1 },
  { name: "Testing / Validation", color: "#F97316", position: 2 },
  { name: "Production Scale-Up", color: "#8B5CF6", position: 3 },
  { name: "Launch", color: "#EF4444", position: 4 },
] as const;

// Gantt chart colors for phases
export const PHASE_COLORS = [
  "#3B82F6", "#22C55E", "#F97316", "#8B5CF6", "#EF4444",
  "#EAB308", "#06B6D4", "#EC4899", "#14B8A6", "#6366F1",
] as const;
