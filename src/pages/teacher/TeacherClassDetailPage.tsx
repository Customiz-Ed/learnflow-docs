import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, Copy, Download, FileDown, Layers, Plus, Upload } from "lucide-react";
import { isAxiosError } from "axios";
import { classApi } from "@/api/classApi";
import { divisionApi } from "@/api/divisionApi";
import { EmptyState, PageHeader } from "@/components/ui/page-helpers";
import { toast } from "sonner";
import type { BulkImportResult } from "@/types/api.types";

export default function TeacherClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showDivForm, setShowDivForm] = useState(false);
  const [divForm, setDivForm] = useState({ name: "" });
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);
  const [bulkError, setBulkError] = useState("");
  const queryClient = useQueryClient();

  const { data: cls } = useQuery({
    queryKey: ["teacher-class", id],
    queryFn: () => classApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: divisions } = useQuery({
    queryKey: ["teacher-divisions", id],
    queryFn: () => classApi.listDivisions(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const resolvedDivisionId = useMemo(
    () => selectedDivisionId || divisions?.[0]?.id || "",
    [selectedDivisionId, divisions],
  );

  const createDivision = useMutation({
    mutationFn: () => classApi.createDivision(id!, { name: divForm.name, teacherId: cls?.teacherId || undefined }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["teacher-divisions", id] });
      setShowDivForm(false);
      setDivForm({ name: "" });
    },
    onError: (err: unknown) => {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to create division");
        return;
      }
      toast.error("Failed to create division");
    },
  });

  const downloadTemplate = useMutation({
    mutationFn: () => divisionApi.downloadStudentsTemplate(resolvedDivisionId),
    onSuccess: (response) => {
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "students_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded.");
    },
    onError: (err) => {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to download template");
        return;
      }
      toast.error("Failed to download template");
    },
  });

  const uploadBulkStudents = useMutation({
    mutationFn: () => {
      if (!bulkFile) throw new Error("Please choose an Excel file");
      if (!/\.(xlsx|xls)$/i.test(bulkFile.name)) {
        throw new Error("Invalid file format. Only .xlsx and .xls files are allowed.");
      }
      if (bulkFile.size > 5 * 1024 * 1024) {
        throw new Error("File size exceeds 5MB limit.");
      }
      return divisionApi.bulkUploadStudents(resolvedDivisionId, bulkFile);
    },
    onSuccess: (res) => {
      setBulkResult(res.data.data);
      setBulkError("");
      toast.success(res.data.message || "Bulk upload completed");
      queryClient.invalidateQueries({ queryKey: ["teacher-divisions", id] });
    },
    onError: (err) => {
      if (isAxiosError(err)) {
        const message = err.response?.data?.message || "Bulk upload failed";
        setBulkError(message);
        toast.error(message);
        return;
      }
      const message = err instanceof Error ? err.message : "Bulk upload failed";
      setBulkError(message);
      toast.error(message);
    },
  });

  const copyCredential = async (username: string, password: string) => {
    await navigator.clipboard.writeText(`${username} / ${password}`);
    toast.success("Credentials copied to clipboard.");
  };

  const exportCsv = () => {
    if (!bulkResult) return;
    const header = ["rowIndex", "username", "status", "message", "studentId", "defaultPassword"];
    const rows = bulkResult.details.map((row) =>
      [
        row.rowIndex,
        row.username,
        row.status,
        row.message,
        row.studentId || "",
        row.credentials?.defaultPassword || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teacher-bulk-upload-results.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title={cls?.name || "Class"}
        description={`School: ${cls?.school?.name || "-"}`}
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowDivForm(!showDivForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus size={18} /> Add Division
          </motion.button>
        }
      />

      {showDivForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 rounded-xl bg-card p-6 shadow-surface">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Division Name *</label>
              <input
                placeholder="Division A"
                value={divForm.name}
                onChange={(e) => setDivForm({ name: e.target.value })}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => createDivision.mutate()}
              disabled={!divForm.name || createDivision.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {createDivision.isPending ? "Creating..." : "Create Division"}
            </motion.button>
            <button onClick={() => setShowDivForm(false)} className="text-sm text-muted-foreground">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {!divisions?.length ? (
        <EmptyState title="No divisions yet" description="Create a division to organize students within this class." icon={<Layers size={32} />} />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {divisions.map((div, i) => (
              <motion.div
                key={div.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl bg-card p-6 shadow-surface"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers size={20} />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{div.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Teacher: {div.teacher?.name || "None"}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">{div.id}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl bg-card p-6 shadow-surface">
            <h3 className="text-lg font-semibold text-foreground">Bulk Student Upload</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Required columns: Student Name. Optional columns: Age, Username. Grade is not used in this flow.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Division</label>
                <select
                  value={resolvedDivisionId}
                  onChange={(e) => setSelectedDivisionId(e.target.value)}
                  className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Excel file</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    setBulkFile(e.target.files?.[0] ?? null);
                    setBulkError("");
                  }}
                  className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => downloadTemplate.mutate()}
                disabled={!resolvedDivisionId || downloadTemplate.isPending}
                className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground disabled:opacity-50"
              >
                <Download size={16} />
                {downloadTemplate.isPending ? "Downloading..." : "Download Template"}
              </button>
              <button
                onClick={() => uploadBulkStudents.mutate()}
                disabled={!resolvedDivisionId || !bulkFile || uploadBulkStudents.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Upload size={16} />
                {uploadBulkStudents.isPending ? "Uploading..." : "Upload Students"}
              </button>
            </div>

            {bulkError && (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {bulkError}
              </div>
            )}

            {bulkResult && (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle size={16} />
                    Credentials are temporary. Share them securely with students.
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted p-3 text-sm">Total: {bulkResult.summary.total}</div>
                  <div className="rounded-lg bg-success/10 p-3 text-sm text-success">Created: {bulkResult.summary.created}</div>
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Failed: {bulkResult.summary.failed}</div>
                  <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">Duplicates: {bulkResult.summary.duplicates}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportCsv}
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium"
                  >
                    <FileDown size={14} /> Export Results CSV
                  </button>
                </div>

                <div className="max-h-64 overflow-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-left text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Username</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Message</th>
                        <th className="px-3 py-2">Student ID</th>
                        <th className="px-3 py-2">Default Password</th>
                        <th className="px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResult.details.map((row) => (
                        <tr key={`${row.rowIndex}-${row.username}`} className="border-t border-border">
                          <td className="px-3 py-2">{row.rowIndex}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.username}</td>
                          <td className="px-3 py-2 capitalize">{row.status}</td>
                          <td className="px-3 py-2">{row.message}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.studentId || "-"}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.credentials?.defaultPassword || "-"}</td>
                          <td className="px-3 py-2">
                            {row.credentials ? (
                              <button
                                onClick={() => copyCredential(row.credentials!.username, row.credentials!.defaultPassword)}
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
                              >
                                <Copy size={12} /> Copy
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
