"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Pencil, Save, X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { COLUMN_TYPES, BOARD_TYPES } from "@/lib/constants";

export function WorkflowEditor() {
  const projectsQuery = trpc.project.list.useQuery();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  return (
    <div className="space-y-6">
      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Editor</CardTitle>
          <CardDescription>
            Add, rename, or delete board columns for your project. Set WIP limits to prevent overloading.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Select Project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projectsQuery.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.key} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedProjectId && <ColumnManager projectId={selectedProjectId} />}
    </div>
  );
}

function ColumnManager({ projectId }: { projectId: string }) {
  const utils = trpc.useUtils();
  const columnsQuery = trpc.project.listColumns.useQuery({ projectId });

  // Add column state
  const [newName, setNewName] = useState("");
  const [newColType, setNewColType] = useState("TODO");
  const [newBoardType, setNewBoardType] = useState("SPRINT_BOARD");
  const [newWipLimit, setNewWipLimit] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColType, setEditColType] = useState("");
  const [editWipLimit, setEditWipLimit] = useState("");

  const addMutation = trpc.project.addColumn.useMutation({
    onSuccess: () => {
      toast.success("Column added!");
      utils.project.listColumns.invalidate({ projectId });
      setNewName("");
      setNewWipLimit("");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.project.updateColumn.useMutation({
    onSuccess: () => {
      toast.success("Column updated!");
      utils.project.listColumns.invalidate({ projectId });
      setEditingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.project.deleteColumn.useMutation({
    onSuccess: () => {
      toast.success("Column deleted!");
      utils.project.listColumns.invalidate({ projectId });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleAdd() {
    if (!newName.trim()) return;
    addMutation.mutate({
      projectId,
      name: newName.trim(),
      colType: newColType as "BACKLOG" | "TODO" | "DOING" | "DONE",
      boardType: newBoardType as "SPRINT_BOARD" | "GLOBAL_PRODUCT_BACKLOG",
      wipLimit: newWipLimit ? parseInt(newWipLimit) : null,
    });
  }

  function startEdit(col: any) {
    setEditingId(col.id);
    setEditName(col.name);
    setEditColType(col.colType);
    setEditWipLimit(col.wipLimit?.toString() ?? "");
  }

  function saveEdit() {
    if (!editingId || !editName.trim()) return;
    updateMutation.mutate({
      columnId: editingId,
      name: editName.trim(),
      colType: editColType as "BACKLOG" | "TODO" | "DOING" | "DONE",
      wipLimit: editWipLimit ? parseInt(editWipLimit) : null,
    });
  }

  const sprintColumns = columnsQuery.data?.filter((c) => c.boardType === "SPRINT_BOARD") ?? [];
  const backlogColumns = columnsQuery.data?.filter((c) => c.boardType === "GLOBAL_PRODUCT_BACKLOG") ?? [];

  return (
    <div className="space-y-6">
      {/* Sprint Board Columns */}
      <ColumnTable
        title="Sprint Board Columns"
        description="Columns shown on the Sprint Board view."
        columns={sprintColumns}
        editingId={editingId}
        editName={editName}
        editColType={editColType}
        editWipLimit={editWipLimit}
        setEditName={setEditName}
        setEditColType={setEditColType}
        setEditWipLimit={setEditWipLimit}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onCancelEdit={() => setEditingId(null)}
        onDelete={(id) => deleteMutation.mutate({ columnId: id })}
        isDeleting={deleteMutation.isPending}
      />

      {/* Product Backlog Columns */}
      <ColumnTable
        title="Product Backlog Columns"
        description="Columns shown on the Product Backlog view."
        columns={backlogColumns}
        editingId={editingId}
        editName={editName}
        editColType={editColType}
        editWipLimit={editWipLimit}
        setEditName={setEditName}
        setEditColType={setEditColType}
        setEditWipLimit={setEditWipLimit}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onCancelEdit={() => setEditingId(null)}
        onDelete={(id) => deleteMutation.mutate({ columnId: id })}
        isDeleting={deleteMutation.isPending}
      />

      {/* Add Column Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Column</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., QA Review" className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">System Type</Label>
              <Select value={newColType} onValueChange={setNewColType}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLUMN_TYPES.map((ct) => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Board</Label>
              <Select value={newBoardType} onValueChange={setNewBoardType}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BOARD_TYPES.map((bt) => <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">WIP Limit</Label>
              <Input type="number" min="1" value={newWipLimit} onChange={(e) => setNewWipLimit(e.target.value)} placeholder="∞" className="w-20" />
            </div>
            <Button onClick={handleAdd} disabled={addMutation.isPending || !newName.trim()}>
              <Plus className="mr-1 h-4 w-4" />{addMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ColumnTable({
  title, description, columns,
  editingId, editName, editColType, editWipLimit,
  setEditName, setEditColType, setEditWipLimit,
  onStartEdit, onSaveEdit, onCancelEdit, onDelete, isDeleting,
}: {
  title: string; description: string; columns: any[];
  editingId: string | null; editName: string; editColType: string; editWipLimit: string;
  setEditName: (v: string) => void; setEditColType: (v: string) => void; setEditWipLimit: (v: string) => void;
  onStartEdit: (col: any) => void; onSaveEdit: () => void; onCancelEdit: () => void;
  onDelete: (id: string) => void; isDeleting: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {columns.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No columns configured.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>System Type</TableHead>
                <TableHead>WIP Limit</TableHead>
                <TableHead className="w-16">Stories</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.map((col, idx) => (
                <TableRow key={col.id}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    {editingId === col.id ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-sm w-40" autoFocus />
                    ) : (
                      <span className="font-medium">{col.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === col.id ? (
                      <Select value={editColType} onValueChange={setEditColType}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COLUMN_TYPES.map((ct) => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">{col.colType}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === col.id ? (
                      <Input type="number" min="1" value={editWipLimit} onChange={(e) => setEditWipLimit(e.target.value)} placeholder="∞" className="h-7 w-16 text-sm" />
                    ) : col.wipLimit != null ? (
                      <span className="text-sm">{col.wipLimit}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No limit</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{col._count.stories}</TableCell>
                  <TableCell>
                    {editingId === col.id ? (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onSaveEdit}><Save className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelEdit}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onStartEdit(col)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDelete(col.id)} disabled={isDeleting || col._count.stories > 0}
                          title={col._count.stories > 0 ? "Move stories first" : "Delete column"}
                        >
                          {col._count.stories > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
