import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { schoolApi } from "@/api/schoolApi";
import { catalogApi } from "@/api/catalogApi";
import { classApi } from "@/api/classApi";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { School, Plus, MapPin, Mail, Trash2, Download, Upload, Copy, FileDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { BulkImportResult } from "@/types/api.types";

export default function SchoolsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", contactEmail: "", contactPhone: "" });
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ classId?: string; divisionId?: string; file?: string; submit?: string }>({});
  const queryClient = useQueryClient();

  const { data: schools, isLoading } = useQuery({
    queryKey: ["schools"],
    queryFn: () => schoolApi.list().then((r) => r.data.data),
  });

  const { data: schoolClasses } = useQuery({
    queryKey: ["school-classes", selectedSchoolId],
    queryFn: () => catalogApi.getSchoolClasses(selectedSchoolId).then((r) => r.data.data),
    enabled: !!selectedSchoolId,
  });

  const { data: classDivisions } = useQuery({
    queryKey: ["class-divisions", selectedClassId],
    queryFn: () => classApi.listDivisions(selectedClassId).then((r) => r.data.data),
    enabled: !!selectedClassId,
  });

  useEffect(() => {
    const savedSchoolId = localStorage.getItem("bulkUploadSchoolId");
    const savedClassId = localStorage.getItem("bulkUploadClassId");
    const savedDivisionId = localStorage.getItem("bulkUploadDivisionId");
    if (savedSchoolId) setSelectedSchoolId(savedSchoolId);
    if (savedClassId) setSelectedClassId(savedClassId);
    if (savedDivisionId) setSelectedDivisionId(savedDivisionId);
  }, []);

  useEffect(() => {
    setSelectedClassId("");
    setSelectedDivisionId("");
    setValidationErrors((prev) => ({ ...prev, classId: undefined, divisionId: undefined }));
  }, [selectedSchoolId]);

  useEffect(() => {
    setSelectedDivisionId("");
    setValidationErrors((prev) => ({ ...prev, divisionId: undefined }));
  }, [selectedClassId]);

  const selectedDivision = useMemo(
    () => classDivisions?.find((div) => div.id === selectedDivisionId),
    [classDivisions, selectedDivisionId],
  );

  const validateUpload = () => {
    const nextErrors: typeof validationErrors = {};
    if (!selectedClassId) {
      nextErrors.classId = "Class is required.";
    }
    if (!selectedDivisionId) {
      nextErrors.divisionId = "Division is required.";
    }
    if (!bulkFile) {
      nextErrors.file = "Please select an Excel file.";
    } else {
      const validExt = /\.(xlsx|xls)$/i.test(bulkFile.name);
      if (!validExt) {
        nextErrors.file = "Invalid file format. Only .xlsx and .xls files are allowed.";
      } else if (bulkFile.size > 5 * 1024 * 1024) {
        nextErrors.file = "File size exceeds 5MB limit.";
      }
    }
    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

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

  const downloadTemplate = useMutation({
    mutationFn: () => schoolApi.downloadStudentsTemplate(selectedSchoolId),
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

  const uploadBulk = useMutation({
    mutationFn: () => {
      if (!validateUpload()) {
        throw new Error("Please resolve validation errors before upload.");
      }
      return schoolApi.bulkUploadStudents(selectedSchoolId, bulkFile!, selectedClassId, selectedDivisionId);
    },
    onSuccess: (res) => {
      setBulkResult(res.data.data);
      localStorage.setItem("bulkUploadSchoolId", selectedSchoolId);
      localStorage.setItem("bulkUploadClassId", selectedClassId);
      localStorage.setItem("bulkUploadDivisionId", selectedDivisionId);
      setValidationErrors({});
      toast.success(res.data.message || "Bulk upload completed");
    },
    onError: (err) => {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message || "Bulk upload failed";
        setValidationErrors((prev) => ({ ...prev, submit: backendMessage }));
        toast.error(backendMessage);
        return;
      }
      toast.error("Bulk upload failed");
    },
  });

  const handleCopyCredential = async (username: string, password: string) => {
    await navigator.clipboard.writeText(`${username} / ${password}`);
    toast.success("Credentials copied to clipboard.");
  };

  const exportResultsAsCsv = () => {
    if (!bulkResult) return;
    const header = ["rowIndex", "username", "status", "message", "studentId", "defaultPassword"];
    const lines = bulkResult.details.map((row) =>
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
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-upload-results.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

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

      {!!schools?.length && (
        <div className="mb-8 rounded-xl bg-card p-6 shadow-surface">
          <h3 className="text-heading-3 font-semibold text-foreground">Bulk Student Upload (School)</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Required columns: Student Name. Optional columns: Age, Username. Grade is not used in this flow.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">School</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Class *</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select class</option>
                {schoolClasses?.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {validationErrors.classId && <p className="mt-1 text-xs text-destructive">{validationErrors.classId}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Division *</label>
              <select
                value={selectedDivisionId}
                onChange={(e) => setSelectedDivisionId(e.target.value)}
                disabled={!selectedClassId}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                <option value="">Select division</option>
                {classDivisions?.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
                  </option>
                ))}
              </select>
              {validationErrors.divisionId && <p className="mt-1 text-xs text-destructive">{validationErrors.divisionId}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Excel file</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setBulkFile(e.target.files?.[0] ?? null);
                  setValidationErrors((prev) => ({ ...prev, file: undefined, submit: undefined }));
                }}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
              />
              {validationErrors.file && <p className="mt-1 text-xs text-destructive">{validationErrors.file}</p>}
            </div>
          </div>

          {selectedDivision && (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Enrollment routing teacher: <span className="font-medium text-foreground">{selectedDivision.teacher?.name || "No teacher assigned"}</span>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => downloadTemplate.mutate()}
              disabled={!selectedSchoolId || downloadTemplate.isPending}
              className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground disabled:opacity-50"
            >
              <Download size={16} />
              {downloadTemplate.isPending ? "Downloading..." : "Download Template"}
            </button>
            <button
              onClick={() => uploadBulk.mutate()}
              disabled={!selectedSchoolId || !selectedClassId || !selectedDivisionId || !bulkFile || uploadBulk.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Upload size={16} />
              {uploadBulk.isPending ? "Uploading..." : "Upload Students"}
            </button>
          </div>

          {validationErrors.submit && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {validationErrors.submit}
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

              <div className="grid gap-3 sm:grid-cols-4 text-sm">
                <div className="rounded-lg bg-muted p-3">Total: {bulkResult.summary.total}</div>
                <div className="rounded-lg bg-success/10 p-3 text-success">Created: {bulkResult.summary.created}</div>
                <div className="rounded-lg bg-destructive/10 p-3 text-destructive">Failed: {bulkResult.summary.failed}</div>
                <div className="rounded-lg bg-primary/10 p-3 text-primary">Duplicates: {bulkResult.summary.duplicates}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportResultsAsCsv}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium"
                >
                  <FileDown size={14} /> Export Results CSV
                </button>
              </div>

              <div className="max-h-72 overflow-auto rounded-lg border border-border">
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
                              onClick={() =>
                                handleCopyCredential(row.credentials!.username, row.credentials!.defaultPassword)
                              }
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
