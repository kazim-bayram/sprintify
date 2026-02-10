"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FIELD_TYPES } from "@/lib/constants";

export function FormBuilder() {
  const utils = trpc.useUtils();
  const fieldsQuery = trpc.admin.listFields.useQuery();

  // New field state
  const [name, setName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  const createMutation = trpc.admin.createField.useMutation({
    onSuccess: () => {
      toast.success("Custom field created!");
      utils.admin.listFields.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteField.useMutation({
    onSuccess: () => {
      toast.success("Field deleted.");
      utils.admin.listFields.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setName(""); setFieldKey(""); setFieldType("TEXT");
    setIsRequired(false); setOptions([]); setOptionInput("");
  }

  function handleNameChange(val: string) {
    setName(val);
    // Auto-generate key from name
    setFieldKey(val.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  }

  function addOption() {
    const trimmed = optionInput.trim();
    if (!trimmed || options.includes(trimmed)) return;
    setOptions([...options, trimmed]);
    setOptionInput("");
  }

  function handleCreate() {
    if (!name.trim() || !fieldKey.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      fieldKey: fieldKey.trim(),
      type: fieldType as "TEXT" | "NUMBER" | "SELECT" | "DATE" | "USER",
      isRequired,
      options: fieldType === "SELECT" ? options : [],
    });
  }

  const fields = fieldsQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Existing Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Fields</CardTitle>
          <CardDescription>
            Define custom fields for your organization. These appear in the story creation/edit forms for all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No custom fields defined yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{field.fieldKey}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{field.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {field.options.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {field.options.map((opt) => (
                            <Badge key={opt} variant="secondary" className="text-[10px]">{opt}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {field.isRequired ? (
                        <Badge variant="destructive" className="text-[10px]">Required</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Optional</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: field.id })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add New Field */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Custom Field</CardTitle>
          <CardDescription>
            Create a new field. It will immediately appear in the story forms for all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Display Name</Label>
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g., Regulatory Code" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Field Key</Label>
              <Input value={fieldKey} onChange={(e) => setFieldKey(e.target.value)} placeholder="regulatory_code" className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={fieldType} onValueChange={setFieldType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((ft) => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <div className="flex items-center gap-2">
                <Switch id="required" checked={isRequired} onCheckedChange={setIsRequired} />
                <Label htmlFor="required" className="text-xs">Required</Label>
              </div>
            </div>
          </div>

          {/* Options for SELECT type */}
          {fieldType === "SELECT" && (
            <div className="space-y-2">
              <Label className="text-xs">Dropdown Options</Label>
              <div className="flex gap-2">
                <Input
                  value={optionInput} onChange={(e) => setOptionInput(e.target.value)}
                  placeholder="Add an option..." className="max-w-xs"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addOption}><Plus className="h-3 w-3 mr-1" />Add</Button>
              </div>
              {options.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {options.map((opt, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                      {opt}
                      <button onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={handleCreate} disabled={createMutation.isPending || !name.trim() || !fieldKey.trim()}>
            <Plus className="mr-1 h-4 w-4" />{createMutation.isPending ? "Creating..." : "Create Field"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
