import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentApi } from "@/api/enrollmentApi";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { UserCheck, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function TeacherEnrollmentsPage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["pending-enrollments"],
    queryFn: () => enrollmentApi.getPending().then((r) => r.data.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "REJECTED" }) =>
      enrollmentApi.review(id, { status }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["pending-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
    },
    onError: (err: any) => {toast.error(err.response?.data?.message || "Failed"), console.error(err)},
  });

  return (
    <div>
      <PageHeader title="Enrollment Requests" description="Review pending student enrollment requests." />
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !requests?.length ? (
        <EmptyState title="No pending requests" description="All enrollment requests have been reviewed." icon={<UserCheck size={32} />} />
      ) : (
        <div className="space-y-4">
          {requests.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 rounded-xl bg-card p-6 shadow-surface">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {req.student?.name?.charAt(0) || "S"}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{req.student?.name || "Student"}</p>
                <p className="text-sm text-muted-foreground">
                  Division: {req.division?.name || req.divisionId} • School: {req.school?.name || req.schoolId}
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => reviewMutation.mutate({ id: req.id, status: "ACCEPTED" })}
                  disabled={reviewMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success hover:bg-success/20">
                  <Check size={16} /> Accept
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => reviewMutation.mutate({ id: req.id, status: "REJECTED" })}
                  disabled={reviewMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/20">
                  <X size={16} /> Reject
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
