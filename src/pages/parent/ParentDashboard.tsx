import { useQuery } from "@tanstack/react-query";
import { parentApi } from "@/api/parentApi";
import { PageHeader } from "@/components/ui/page-helpers";

export default function ParentDashboard() {
  const { data: parent, isLoading } = useQuery({
    queryKey: ["parent-me"],
    queryFn: () => parentApi.getMe().then((r) => r.data.data),
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  if (!parent) return null;

  return (
    <div>
      <PageHeader title={`Welcome, ${parent.name}`} description="Monitor your child's education progress." />
      <div className="rounded-xl bg-card p-6 shadow-surface">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {parent.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{parent.name}</h3>
            <p className="text-sm text-muted-foreground">{parent.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium text-foreground">{parent.phone}</p></div>
          <div><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm text-foreground">{new Date(parent.createdAt).toLocaleDateString()}</p></div>
        </div>
      </div>
    </div>
  );
}
