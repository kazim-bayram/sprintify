import { PokerHub } from "@/components/poker/poker-hub";

export const metadata = {
  title: "Planning Poker — Sprintify",
};

export default function PokerPage() {
  return (
    <div className="p-6">
      <PokerHub />
    </div>
  );
}
