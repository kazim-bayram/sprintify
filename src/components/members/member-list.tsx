"use client";

import { trpc } from "@/trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { UserPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InviteDialog } from "./invite-dialog";

export function MemberList() {
  const utils = trpc.useUtils();
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data: members, isLoading } = trpc.member.list.useQuery();

  const updateRole = trpc.member.updateRole.useMutation({
    onSuccess: () => {
      utils.member.list.invalidate();
      toast.success("Role updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMember = trpc.member.remove.useMutation({
    onSuccess: () => {
      utils.member.list.invalidate();
      toast.success("Member removed");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization&apos;s team members and roles.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading members...</p>
      ) : (
        <div className="space-y-2">
          {members?.map((m) => (
            <Card key={m.id} className="flex items-center gap-4 p-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={m.user.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {m.user.name?.charAt(0) ?? m.user.email.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.user.name ?? "Unnamed"}</p>
                <p className="text-sm text-muted-foreground truncate">{m.user.email}</p>
              </div>

              <Select
                value={m.role}
                onValueChange={(role) =>
                  updateRole.mutate({
                    membershipId: m.id,
                    role: role as "ADMIN" | "MEMBER" | "VIEWER",
                  })
                }
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN" className="text-xs">
                    Admin
                  </SelectItem>
                  <SelectItem value="MEMBER" className="text-xs">
                    Member
                  </SelectItem>
                  <SelectItem value="VIEWER" className="text-xs">
                    Viewer
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeMember.mutate({ membershipId: m.id })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
