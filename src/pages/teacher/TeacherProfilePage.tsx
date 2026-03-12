import { useQuery } from "@tanstack/react-query";
import { teacherApi } from "@/api/teacherApi";
import { PageHeader } from "@/components/ui/page-helpers";
import { User } from "lucide-react";

export default function TeacherProfilePage() {
  const { data: teacher, isLoading } = useQuery({
    queryKey: ["teacher-me"],
    queryFn: () => teacherApi.getMe().then((r) => r.data.data),
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  if (!teacher) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Your teacher profile information." />
      <div className="rounded-xl bg-card p-6 shadow-surface">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {teacher.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{teacher.name}</h3>
            <p className="text-sm text-muted-foreground">{teacher.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium text-foreground">{teacher.phone}</p></div>
          <div><p className="text-xs text-muted-foreground">Teacher Code</p><p className="font-mono font-medium text-foreground">{teacher.teacherCode}</p></div>
          <div><p className="text-xs text-muted-foreground">School ID</p><p className="font-mono text-sm text-foreground">{teacher.schoolId}</p></div>
          <div><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm text-foreground">{new Date(teacher.createdAt).toLocaleDateString()}</p></div>
        </div>
      </div>
    </div>
  );
}
