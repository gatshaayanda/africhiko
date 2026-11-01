import AfrichikoSharedWork from "@/components/AfrichikoSharedWork";

export default async function SharedWorkPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  return <AfrichikoSharedWork shareId={shareId} />;
}
