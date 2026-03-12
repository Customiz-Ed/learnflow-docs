import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolApi } from "@/api/schoolApi";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { School, Plus, MapPin, Mail, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SchoolsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", contactEmail: "", contactPhone: "" });
  const queryClient = useQueryClient();

  const { data: schools, isLoading } = useQuery({
    queryKey: ["schools"],
    queryFn: () => schoolApi.list().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => schoolApi.create(form),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setShowForm(false);
      setForm({ name: "", address: "", city: "", state: "", contactEmail: "", contactPhone: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create school"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schoolApi.remove(id),
    onSuccess: () => {
      toast.success("School deleted");
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Schools"
        description="Manage all schools on the platform."
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-surface-md"
          >
            <Plus size={18} /> Add School
          </motion.button>
        }
      />

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-8 rounded-xl bg-card p-6 shadow-surface"
        >
          <h3 className="mb-4 text-heading-3 font-semibold text-foreground">New School</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "name", label: "School Name *", placeholder: "Springfield Elementary" },
              { key: "address", label: "Address", placeholder: "123 Main St" },
              { key: "city", label: "City", placeholder: "Springfield" },
              { key: "state", label: "State", placeholder: "IL" },
              { key: "contactEmail", label: "Contact Email", placeholder: "info@school.edu" },
              { key: "contactPhone", label: "Contact Phone", placeholder: "+1 234 567 8900" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{f.label}</label>
                <input
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => createMutation.mutate()}
              disabled={!form.name || createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create School"}
            </motion.button>
            <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !schools?.length ? (
        <EmptyState
          title="No schools yet"
          description="Create your first school to get started."
          icon={<School size={32} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school, i) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.02 }}
              className="group rounded-xl bg-card p-6 shadow-surface transition-shadow hover:shadow-surface-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <School size={20} />
                </div>
                <button
                  onClick={() => deleteMutation.mutate(school.id)}
                  className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{school.name}</h3>
              {school.city && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin size={14} /> {school.city}{school.state ? `, ${school.state}` : ""}
                </p>
              )}
              {school.contactEmail && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail size={14} /> {school.contactEmail}
                </p>
              )}
              <p className="mt-2 font-mono text-xs text-muted-foreground">{school.id}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
