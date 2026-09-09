import { PageLoader } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <PageLoader label="Menyiapkan halaman..." />
    </div>
  );
}
