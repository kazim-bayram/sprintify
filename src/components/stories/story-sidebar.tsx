"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRIORITIES, STORY_POINTS, STORY_STATUSES, DEPARTMENTS, WSJF_SCALE, calculateWSJF } from "@/lib/constants";
import { User, Flag, Hash, Circle, Building2, BarChart3, Calendar, Clock, Percent } from "lucide-react";
import { useProjectTerminology } from "@/hooks/use-project-terminology";
import { format } from "date-fns";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type StoryDetail = RouterOutputs["story"]["getById"];

export function StorySidebar({ story }: { story: StoryDetail }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const members = trpc.member.list.useQuery();
  const features = trpc.feature.list.useQuery({ projectId: story.projectId });

  const updateMutation = trpc.story.update.useMutation({
    onSuccess: () => { utils.story.getById.invalidate({ id: story.id }); router.refresh(); },
    onError: (err) => toast.error(err.message),
  });

  function update(data: Record<string, unknown>) {
    updateMutation.mutate({ id: story.id, ...data });
  }

  const terminology = useProjectTerminology(story.project.methodology);
  const isWaterfall = terminology.isWaterfall;
  const phasesQuery = trpc.phase.list.useQuery({ projectId: story.projectId }, { enabled: isWaterfall });
  const phases = phasesQuery.data ?? [];
  const wsjf = isWaterfall
    ? 0
    : calculateWSJF(
        story.userBusinessValue,
        story.timeCriticality,
        story.riskReduction,
        story.jobSize,
      );

  return (
    <div className="space-y-3 text-sm">
      {/* WSJF Score Highlight */}
      {!isWaterfall && wsjf > 0 && (
        <div className="flex items-center gap-2 rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">WSJF Score</span>
          <span className="ml-auto text-lg font-bold text-primary">{wsjf}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Status */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Circle className="h-3 w-3" /> Status</label>
          <Select value={story.status} onValueChange={(v) => update({ status: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STORY_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Flag className="h-3 w-3" /> Priority</label>
          <Select value={story.priority} onValueChange={(v) => update({ priority: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Department */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3" /> Department</label>
          <Select value={story.department ?? "none"} onValueChange={(v) => update({ department: v === "none" ? null : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Owner */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3 w-3" /> Owner</label>
          <Select value={story.assigneeId ?? "unassigned"} onValueChange={(v) => update({ assigneeId: v === "unassigned" ? null : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned" className="text-xs">Unassigned</SelectItem>
              {members.data?.map((m) => (
                <SelectItem key={m.user.id} value={m.user.id} className="text-xs">
                  <span className="flex items-center gap-2">
                    <Avatar className="h-4 w-4"><AvatarImage src={m.user.avatarUrl ?? undefined} /><AvatarFallback className="text-[8px]">{m.user.name?.charAt(0) ?? m.user.email.charAt(0)}</AvatarFallback></Avatar>
                    {m.user.name ?? m.user.email}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Story Points */}
        {!isWaterfall && (
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" /> Story Points
            </label>
            <Select
              value={story.storyPoints?.toString() ?? "none"}
              onValueChange={(v) => update({ storyPoints: v === "none" ? null : parseInt(v) })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  None
                </SelectItem>
                {STORY_POINTS.map((sp) => (
                  <SelectItem key={sp} value={sp.toString()} className="text-xs">
                    {sp} point{sp !== 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Phase (Waterfall) or Feature (Agile) */}
        {isWaterfall ? (
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">{terminology.groupSingular}</label>
            <Select value={story.phaseId ?? "none"} onValueChange={(v) => update({ phaseId: v === "none" ? null : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">None</SelectItem>
                {phases.map((p: { id: string; name: string }) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">Feature (Stage)</label>
            <Select value={story.featureId ?? "none"} onValueChange={(v) => update({ featureId: v === "none" ? null : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">None</SelectItem>
                {features.data?.map((f) => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Waterfall: Start, End, Duration, % Complete, Predecessors */}
      {isWaterfall && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <span className="text-xs font-semibold">Schedule</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={story.startDate ? format(new Date(story.startDate), "yyyy-MM-dd") : ""}
                onChange={(e) => update({ startDate: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date</label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={story.endDate ? format(new Date(story.endDate), "yyyy-MM-dd") : ""}
                onChange={(e) => update({ endDate: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Duration (days)</label>
              <Input
                type="number"
                min={0}
                step={0.5}
                className="h-8 text-xs"
                value={"duration" in story && story.duration != null ? story.duration : ""}
                onChange={(e) => update({ duration: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Percent className="h-3 w-3" /> % Complete</label>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-8 text-xs"
                value={"progress" in story && story.progress != null ? story.progress : 0}
                onChange={(e) => update({ progress: e.target.value ? parseInt(e.target.value, 10) : undefined })}
              />
            </div>
          </div>
          {"dependsOn" in story && Array.isArray(story.dependsOn) && story.dependsOn.length > 0 && (
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Predecessors</label>
              <p className="text-xs text-muted-foreground">
                {story.dependsOn
                  .map((d: { predecessor: { number: number; title: string } }) => `${d.predecessor.number}: ${d.predecessor.title}`)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* WSJF Detail Fields */}
      {!isWaterfall && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <span className="text-xs font-semibold">WSJF Breakdown</span>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Value</label>
              <Select
                value={story.userBusinessValue.toString()}
                onValueChange={(v) => update({ userBusinessValue: parseInt(v) })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, ...WSJF_SCALE].map((v) => (
                    <SelectItem key={v} value={v.toString()} className="text-xs">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Criticality</label>
              <Select
                value={story.timeCriticality.toString()}
                onValueChange={(v) => update({ timeCriticality: parseInt(v) })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, ...WSJF_SCALE].map((v) => (
                    <SelectItem key={v} value={v.toString()} className="text-xs">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Risk</label>
              <Select
                value={story.riskReduction.toString()}
                onValueChange={(v) => update({ riskReduction: parseInt(v) })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, ...WSJF_SCALE].map((v) => (
                    <SelectItem key={v} value={v.toString()} className="text-xs">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">Job Size</label>
            <Select
              value={story.jobSize.toString()}
              onValueChange={(v) => update({ jobSize: parseInt(v) })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STORY_POINTS.map((sp) => (
                  <SelectItem key={sp} value={sp.toString()} className="text-xs">
                    {sp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Dynamic Custom Fields */}
      <CustomFieldsSection story={story} onUpdate={update} />

      {/* Reporter (read-only) */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Reported by</span>
        <div className="flex items-center gap-2 text-xs">
          <Avatar className="h-5 w-5"><AvatarImage src={story.reporter.avatarUrl ?? undefined} /><AvatarFallback className="text-[8px]">{story.reporter.name?.charAt(0) ?? story.reporter.email.charAt(0)}</AvatarFallback></Avatar>
          <span>{story.reporter.name ?? story.reporter.email}</span>
        </div>
      </div>
    </div>
  );
}

/** Render custom fields from FieldDefinitions with inline editing */
function CustomFieldsSection({ story, onUpdate }: { story: StoryDetail; onUpdate: (data: Record<string, unknown>) => void }) {
  const fieldDefs = trpc.admin.listFields.useQuery();
  const members = trpc.member.list.useQuery();
  const fields = fieldDefs.data ?? [];

  if (fields.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentValues: Record<string, any> = (story.customValues as Record<string, unknown>) ?? {};

  function handleFieldChange(key: string, value: unknown) {
    const updated = { ...currentValues, [key]: value };
    onUpdate({ customValues: updated });
  }

  return (
    <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2">
      <span className="text-xs font-semibold">Custom Fields</span>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((field) => (
          <div key={field.id} className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">{field.name}{field.isRequired ? " *" : ""}</label>
            {field.type === "TEXT" && (
              <input
                className="w-full rounded border bg-background px-2 py-1 text-xs"
                value={currentValues[field.fieldKey] ?? ""}
                onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                placeholder={field.name}
              />
            )}
            {field.type === "NUMBER" && (
              <input
                type="number"
                className="w-full rounded border bg-background px-2 py-1 text-xs"
                value={currentValues[field.fieldKey] ?? ""}
                onChange={(e) => handleFieldChange(field.fieldKey, e.target.value ? Number(e.target.value) : null)}
              />
            )}
            {field.type === "SELECT" && (
              <Select value={currentValues[field.fieldKey] ?? "__none"} onValueChange={(v) => handleFieldChange(field.fieldKey, v === "__none" ? null : v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none" className="text-xs">None</SelectItem>
                  {field.options.map((opt) => <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {field.type === "DATE" && (
              <input
                type="date"
                className="w-full rounded border bg-background px-2 py-1 text-xs"
                value={currentValues[field.fieldKey] ?? ""}
                onChange={(e) => handleFieldChange(field.fieldKey, e.target.value || null)}
              />
            )}
            {field.type === "USER" && (
              <Select value={currentValues[field.fieldKey] ?? "__none"} onValueChange={(v) => handleFieldChange(field.fieldKey, v === "__none" ? null : v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none" className="text-xs">None</SelectItem>
                  {members.data?.map((m) => <SelectItem key={m.user.id} value={m.user.id} className="text-xs">{m.user.name ?? m.user.email}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
