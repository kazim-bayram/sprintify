"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, FormInput } from "lucide-react";
import { WorkflowEditor } from "./workflow-editor";
import { FormBuilder } from "./form-builder";

export function AdminSettingsView() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure workflows, boards, and custom fields for your organization.
        </p>
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
