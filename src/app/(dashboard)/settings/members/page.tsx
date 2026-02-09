import { MemberList } from "@/components/members/member-list";

export const metadata = {
  title: "Members — Sprintify",
};

export default function MembersPage() {
  return (
    <div className="p-6">
      <MemberList />
    </div>
  );
}
