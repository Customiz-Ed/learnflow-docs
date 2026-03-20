import { Button } from "@/components/ui/button";

interface TestAvailabilityStateProps {
  onBack: () => void;
}

export function TestAvailabilityState({ onBack }: TestAvailabilityStateProps) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-card p-8 text-center shadow-surface">
      <h2 className="text-xl font-semibold text-foreground">This test is not available right now.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        It may have been unpublished, archived, or removed by your teacher.
      </p>
      <Button className="mt-6" onClick={onBack}>
        Back to Tests
      </Button>
    </div>
  );
}
