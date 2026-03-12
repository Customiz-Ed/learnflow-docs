import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classApi } from "@/api/classApi";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { BookOpen, Plus, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [divForm, setDivForm] = useState({ name: "", teacherId: "" });
  const [showDivForm, setShowDivForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: cls } = useQuery({
    queryKey: ["class", id],
    queryFn: () => classApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: divisions } = useQuery({
    queryKey: ["divisions", id],
    queryFn: () => classApi.listDivisions(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const createDivision = useMutation({
    mutationFn: () => classApi.createDivision(id!, { name: divForm.name, teacherId: divForm.teacherId || undefined }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["divisions", id] });
      setShowDivForm(false);
      setDivForm({ name: "", teacherId: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  return (
    <div>
      <PageHeader
        title={cls?.name || "Class"}
        description={`School: ${cls?.school?.name || "—"} • Teacher: ${cls?.teacher?.name || "None assigned"}`}
        action={
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowDivForm(!showDivForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            <Plus size={18} /> Add Division
          </motion.button>
        }
      />

      {showDivForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 rounded-xl bg-card p-6 shadow-surface">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Division Name *</label>
              <input placeholder="Division A" value={divForm.name} onChange={(e) => setDivForm((p) => ({ ...p, name: e.target.value }))}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Teacher ID (optional)</label>
              <input placeholder="Teacher ID" value={divForm.teacherId} onChange={(e) => setDivForm((p) => ({ ...p, teacherId: e.target.value }))}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => createDivision.mutate()} disabled={!divForm.name}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              Create Division
            </motion.button>
            <button onClick={() => setShowDivForm(false)} className="text-sm text-muted-foreground">Cancel</button>
          </div>
        </motion.div>
      )}

      {!divisions?.length ? (
        <EmptyState title="No divisions yet" description="Create a division to organize students within this class." icon={<Layers size={32} />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {divisions.map((div, i) => (
            <motion.div key={div.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl bg-card p-6 shadow-surface">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers size={20} />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{div.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Teacher: {div.teacher?.name || "None"}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{div.id}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
