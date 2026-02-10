import { PokerRoomWrapper } from "@/components/poker/poker-room-wrapper";

interface PokerPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PokerPageProps) {
  const { code } = await params;
  return { title: `Planning Poker ${code} — Sprintify` };
}

export default async function PokerPage({ params }: PokerPageProps) {
  const { code } = await params;
  return <PokerRoomWrapper accessCode={code.toUpperCase()} />;
}
