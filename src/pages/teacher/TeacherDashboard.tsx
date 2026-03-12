import { useQuery } from "@tanstack/react-query";
import { teacherApi } from "@/api/teacherApi";
import { enrollmentApi } from "@/api/enrollmentApi";
import { testApi } from "@/api/testApi";
import { PageHeader, StatCard } from "@/components/ui/page-helpers";
import { Users, UserCheck, FileText, BarChart3 } from "lucide-react";

export default function TeacherDashboard() {
  const { data: students } = useQuery({
    queryKey: ["teacher-students"],
    queryFn: () => teacherApi.getStudents().then((r) => r.data.data),
  });

  const { data: pending } = useQuery({
    queryKey: ["pending-enrollments"],
    queryFn: () => enrollmentApi.getPending().then((r) => r.data.data),
  });

  const { data: tests } = useQuery({
    queryKey: ["teacher-tests"],
    queryFn: () => testApi.list().then((r) => r.data.data),
  });

  const activeTests = tests?.filter((t) => t.status === "ACTIVE").length ?? 0;

  return (
    <div>
      <PageHeader title="Teacher Dashboard" description="Your students, enrollments, and tests at a glance." />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={students?.length ?? "—"} icon={<Users size={20} />} />
        <StatCard label="Pending Enrollments" value={pending?.length ?? "—"} icon={<UserCheck size={20} />}
          trend={pending?.length ? `${pending.length} need review` : undefined} />
        <StatCard label="Total Tests" value={tests?.length ?? "—"} icon={<FileText size={20} />} />
        <StatCard label="Active Tests" value={activeTests} icon={<BarChart3 size={20} />} />
      </div>
    </div>
  );
}
