import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/api/studentApi";
import { PageHeader } from "@/components/ui/page-helpers";

export default function StudentProfilePage() {
  const { data: student, isLoading } = useQuery({
    queryKey: ["student-me"],
    queryFn: () => studentApi.getMe().then((r) => r.data.data),
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  if (!student) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Your student profile." />
      <div className="rounded-xl bg-card p-6 shadow-surface">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {student.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{student.name}</h3>
            <p className="font-mono text-sm text-muted-foreground">@{student.username}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">Grade</p><p className="font-medium text-foreground">{student.grade}</p></div>
          <div><p className="text-xs text-muted-foreground">Age</p><p className="font-medium text-foreground">{student.age || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Baseline</p><p className="font-medium text-foreground">{student.baselineCompleted ? "Completed" : "Pending"}</p></div>
          <div><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm text-foreground">{new Date(student.createdAt).toLocaleDateString()}</p></div>
        </div>
      </div>
    </div>
  );
}
