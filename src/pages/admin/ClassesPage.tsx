import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classApi } from "@/api/classApi";
import { schoolApi } from "@/api/schoolApi";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { BookOpen, Plus, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", schoolId: "", teacherId: "" });
  const queryClient = useQueryClient();

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classApi.list().then((r) => r.data.data),
  });

  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: () => schoolApi.list().then((r) => r.data.data),
  });

  const { data: divisionCounts } = useQuery({
    queryKey: ["division-counts", classes?.map((c) => c.id)],
    queryFn: async () => {
      const results = await Promise.all(
        classes!.map((c) =>
          classApi.listDivisions(c.id).then((r) => [c.id, r.data.data.length] as const)
        )
      );
      return Object.fromEntries(results) as Record<string, number>;
    },
    enabled: !!classes?.length,
  });

  const createMutation = useMutation({
    mutationFn: () => classApi.create({ name: form.name, schoolId: form.schoolId, teacherId: form.teacherId || undefined }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setShowForm(false);
      setForm({ name: "", schoolId: "", teacherId: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classApi.remove(id),
    onSuccess: () => {
      toast.success("Class deleted");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Manage classes across all schools."
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-surface-md"
          >
            <Plus size={18} /> Add Class
          </motion.button>
        }
      />

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 rounded-xl bg-card p-6 shadow-surface">
          <h3 className="mb-4 text-heading-3 font-semibold text-foreground">New Class</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Class Name *</label>
              <input placeholder="Grade 5" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">School *</label>
              <select value={form.schoolId} onChange={(e) => setForm((p) => ({ ...p, schoolId: e.target.value }))}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select school</option>
                {schools?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Teacher ID (optional)</label>
              <input placeholder="Teacher ID" value={form.teacherId} onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => createMutation.mutate()} disabled={!form.name || !form.schoolId || createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {createMutation.isPending ? "Creating..." : "Create Class"}
            </motion.button>
            <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : !classes?.length ? (
        <EmptyState title="No classes yet" description="Create a class to organize students and divisions." icon={<BookOpen size={32} />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls, i) => (
            <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.02 }} className="group rounded-xl bg-card p-6 shadow-surface transition-shadow hover:shadow-surface-md">
              <div className="flex items-start justify-between">
                <Link to={`/admin/classes/${cls.id}`} className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen size={20} />
                </Link>
                <button onClick={() => deleteMutation.mutate(cls.id)}
                  className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
              <Link to={`/admin/classes/${cls.id}`}>
                <h3 className="mt-4 font-semibold text-foreground">{cls.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Layers size={14} /> {divisionCounts?.[cls.id] ?? 0} divisions
                </p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">{cls.id}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
