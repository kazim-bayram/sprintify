"use client";

import { Button } from "@/components/ui/button";
import { FileIcon, Download, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface AttachmentItem {
  id: string; name: string; url: string; size: number; mimeType: string;
  createdAt: Date | string; user: { id: string; name: string | null; avatarUrl: string | null };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({ storyId, attachments }: { storyId: string; attachments: AttachmentItem[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUploadClick() {
    toast.info("File upload will be available once Supabase Storage is configured.");
    fileInputRef.current?.click();
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    toast.info(`Selected: ${file.name} (${formatFileSize(file.size)}). Upload coming soon.`);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="*/*" />
        <Button variant="outline" size="sm" onClick={handleUploadClick}><Upload className="mr-1 h-3.5 w-3.5" />Upload File</Button>
      </div>
      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-md border p-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-muted"><FileIcon className="h-4 w-4 text-muted-foreground" /></div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(a.size)} · {a.user.name ?? "Unknown"}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild><a href={a.url} target="_blank" rel="noopener noreferrer" download><Download className="h-3.5 w-3.5" /></a></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => toast.info("Delete attachment coming soon.")}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground py-4">No files attached (lab results, PDFs, photos...)</p>
      )}
    </div>
  );
}
