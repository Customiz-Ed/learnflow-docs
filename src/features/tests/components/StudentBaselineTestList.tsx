import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudentBaselineTestListData } from "@/features/tests/types";

interface StudentBaselineTestListProps {
  suite: StudentBaselineTestListData;
}

function attemptChipLabel(status: string): string {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "EVALUATED") return "EVALUATED";
  return "SUBMITTED";
}

export function StudentBaselineTestList({ suite }: StudentBaselineTestListProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground shadow-surface">
        Suite Status: <span className="font-semibold text-foreground">{suite.suiteStatus}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suite.tests.map((test) => {
          const hasAttempt = !!test.attempt;

          return (
            <div key={test.id} className="rounded-xl bg-card p-5 shadow-surface">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {test.baselineSubject ? <Badge variant="secondary">{test.baselineSubject}</Badge> : null}
                <Badge variant="outline">{test.status}</Badge>
                {hasAttempt ? <Badge>{attemptChipLabel(test.attempt.status)}</Badge> : null}
              </div>

              <h3 className="text-base font-semibold text-foreground">{test.name}</h3>

              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>Duration: {test.duration ?? "-"} min</p>
                <p>Total Marks: {test.totalMarks ?? "-"}</p>
                {test.attempt?.totalScore != null ? <p>Score: {test.attempt.totalScore}</p> : null}
              </div>

              <div className="mt-4">
                {hasAttempt ? (
                  <Button className="w-full" disabled>
                    Start Disabled
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link to={`/student/tests/${test.id}`}>Open Test</Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
