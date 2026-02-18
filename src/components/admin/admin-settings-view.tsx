"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, FormInput, ClipboardList } from "lucide-react";
import Link from "next/link";
import { WorkflowEditor } from "./workflow-editor";
import { FormBuilder } from "./form-builder";

export function AdminSettingsView() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure workflows, boards, templates, and custom fields for your organization.
        </p>

        <div className="mt-3 inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <ClipboardList className="h-3.5 w-3.5 text-primary" />
          <span>
            Looking for reusable Waterfall/Hybrid blueprints?{" "}
            <Link href="/admin/templates" className="font-medium text-primary underline-offset-2 hover:underline">
              Open Template Engine
            </Link>
            .
          </span>
        </div>
      </div>

      <Tabs defaultValue="workflow" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflow" className="gap-2">
            <Kanban className="h-4 w-4" />
            Workflow Editor
          </TabsTrigger>
          <TabsTrigger value="fields" className="gap-2">
            <FormInput className="h-4 w-4" />
            Form Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <WorkflowEditor />
        </TabsContent>

        <TabsContent value="fields">
          <FormBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
