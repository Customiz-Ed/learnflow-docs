import { useQuery } from "@tanstack/react-query";
import { schoolApi } from "@/api/schoolApi";
import { classApi } from "@/api/classApi";
import { PageHeader, StatCard } from "@/components/ui/page-helpers";
import { School, BookOpen, Users, Layers } from "lucide-react";

export default function AdminDashboard() {
  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: () => schoolApi.list().then((r) => r.data.data),
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classApi.list().then((r) => r.data.data),
  });

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of your platform's schools, classes, and divisions."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Schools" value={schools?.length ?? "—"} icon={<School size={20} />} />
        <StatCard label="Classes" value={classes?.length ?? "—"} icon={<BookOpen size={20} />} />
        <StatCard label="Divisions" value="—" icon={<Layers size={20} />} />
        <StatCard label="Teachers" value="—" icon={<Users size={20} />} />
      </div>
    </div>
  );
}
