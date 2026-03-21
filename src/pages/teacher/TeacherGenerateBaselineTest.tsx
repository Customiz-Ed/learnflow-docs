import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { classApi } from "@/api/classApi";
import { teacherApi } from "@/api/teacherApi";
import { testApi } from "@/api/testApi";
import { PageHeader } from "@/components/ui/page-helpers";
import { CircularProgress } from "@/components/ui/circular-progress";
import { startPolling } from "@/lib/polling";
import type { BaselineGenerationJobStatus } from "@/types/api.types";

type SubjectKey = "ENGLISH" | "MATHS";

type JobView = {
  id: string;
  subject: SubjectKey;
  status: BaselineGenerationJobStatus;
  generatedTestId: string | null;
  baselineSuiteId: string | null;
  errorMessage: string | null;
};

export default function TeacherGenerateBaselineTest() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobs, setJobs] = useState<JobView[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "monitoring" | "done">("idle");
  const pollControllersRef = useRef<Map<string, { cancel: () => void }>>(new Map());

  const [params, setParams] = useState({
    grade: "",
    subject: "ENGLISH" as SubjectKey,
    classId: "",
    divisionId: "",
    testName: "",
    numberOfQuestions: "20",
    difficulty: "Easy",
  });

  const { data: teacher } = useQuery({
    queryKey: ["teacher-me"],
    queryFn: () => teacherApi.getMe().then((r) => r.data.data),
  });

  const { data: classes } = useQuery({
    queryKey: ["teacher-classes", teacher?.id],
    queryFn: () => classApi.getByTeacher(teacher!.id).then((r) => r.data.data),
    enabled: !!teacher?.id,
  });

  const { data: divisions } = useQuery({
    queryKey: ["class-divisions", params.classId],
    queryFn: () => classApi.listDivisions(params.classId).then((r) => r.data.data),
    enabled: !!params.classId,
  });

  const uploadUrlMutation = useMutation({
    mutationFn: (payload: { fileName: string; fileHash?: string }) => testApi.getUploadUrl(payload),
  });

  const generateMutation = useMutation({
    mutationFn: (payload: {
      s3Key: string;
      grade: string;
      subject: string;
      classId: string;
      divisionId: string;
      testName?: string;
      numberOfQuestions: number;
      difficulty: string;
    }) => testApi.generateBaselineFromS3(payload),
  });

  const completedSuiteId = useMemo(() => jobs.find((j) => j.baselineSuiteId)?.baselineSuiteId || null, [jobs]);

  const computeSHA256 = async (selectedFile: File) => {
    const arrayBuffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const uploadToS3 = async (selectedFile: File, uploadUrl: string) => {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          resolve();
        } else {
          reject(new Error("S3 upload failed"));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Upload network error")));
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", "application/pdf");
      xhr.send(selectedFile);
    });
  };

  const startJobPolling = (jobId: string, subject: SubjectKey) => {
    if (pollControllersRef.current.has(jobId)) return;

    const controller = startPolling({
      fetcher: async () => {
        const response = await testApi.getBaselineGenerationJob(jobId);
        return response.data.data;
      },
      intervalMs: 9000,
      timeoutMs: 10 * 60 * 1000,
      stopCondition: (data) => data.status === "COMPLETED" || data.status === "FAILED",
      onTick: (data) => {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: data.status,
                  generatedTestId: data.generatedTestId || null,
                  baselineSuiteId: data.baselineSuiteId || null,
                  errorMessage: data.errorMessage || null,
                }
              : job
          )
        );
      },
      onError: () => {
        setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, status: "FAILED", errorMessage: "Polling failed" } : job)));
      },
    });

    pollControllersRef.current.set(jobId, controller);

    setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, subject } : job)));
  };

  useEffect(() => {
    const allFinished = jobs.length > 0 && jobs.every((job) => job.status === "COMPLETED" || job.status === "FAILED");
    if (allFinished) setPhase("done");
  }, [jobs]);

  useEffect(() => {
    const controllers = pollControllersRef.current;
    return () => {
      controllers.forEach((controller) => controller.cancel());
      controllers.clear();
    };
  }, []);

  const handleLaunch = async () => {
    if (!file || !params.grade || !params.classId || !params.divisionId) {
      toast.error("File, grade, class, and division are required.");
      return;
    }

    setIsLaunching(true);
    setPhase("uploading");
    setUploadProgress(0);

    try {
      const fileHash = await computeSHA256(file);
      const uploadRes = await uploadUrlMutation.mutateAsync({ fileName: file.name, fileHash });
      const uploadData = uploadRes.data.data;

      if (!uploadData.alreadyExists) {
        if (!uploadData.uploadUrl) throw new Error("Upload URL missing.");
        await uploadToS3(file, uploadData.uploadUrl);
      } else {
        setUploadProgress(100);
      }

      setPhase("monitoring");

      const res = await generateMutation.mutateAsync({
        s3Key: uploadData.key,
        grade: params.grade,
        subject: params.subject,
        classId: params.classId,
        divisionId: params.divisionId,
        testName: params.testName || undefined,
        numberOfQuestions: Number(params.numberOfQuestions),
        difficulty: params.difficulty,
      });

      const queuedJob: JobView = {
        id: res.data.data.id,
        subject: params.subject,
        status: res.data.data.status,
        generatedTestId: null,
        baselineSuiteId: null,
        errorMessage: null,
      };

      setJobs((prev) => [queuedJob, ...prev.filter((job) => job.id !== queuedJob.id)]);
      startJobPolling(queuedJob.id, params.subject);

      toast.success(`${params.subject} baseline generation job started.`);
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 429 || (status !== undefined && status >= 500)) {
          toast.error("Server is busy. Please retry in a moment.");
        } else {
          toast.error(err.response?.data?.message || "Failed to start baseline generation.");
        }
      } else {
        toast.error("Failed to start baseline generation.");
      }
      setPhase("idle");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div>
      <PageHeader title="Generate Baseline Suite" description="Upload curriculum and generate one baseline subject at a time for the same suite." />

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-xl bg-card p-6 shadow-surface">
          <div className="space-y-4">
            <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center">
              <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 cursor-pointer opacity-0" />
              <Upload size={28} className="mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-foreground">{file ? file.name : "Upload curriculum PDF"}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Grade</label>
                <input value={params.grade} onChange={(e) => setParams((p) => ({ ...p, grade: e.target.value }))} className="h-10 w-full rounded-lg bg-muted px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
                <select value={params.subject} onChange={(e) => setParams((p) => ({ ...p, subject: e.target.value as SubjectKey }))} className="h-10 w-full rounded-lg bg-muted px-3 text-sm">
                  <option value="ENGLISH">ENGLISH</option>
                  <option value="MATHS">MATHS</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Class</label>
                <select value={params.classId} onChange={(e) => setParams((p) => ({ ...p, classId: e.target.value, divisionId: "" }))} className="h-10 w-full rounded-lg bg-muted px-3 text-sm">
                  <option value="">Select class</option>
                  {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Division</label>
                <select value={params.divisionId} onChange={(e) => setParams((p) => ({ ...p, divisionId: e.target.value }))} className="h-10 w-full rounded-lg bg-muted px-3 text-sm">
                  <option value="">Select division</option>
                  {divisions?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Difficulty</label>
                <select value={params.difficulty} onChange={(e) => setParams((p) => ({ ...p, difficulty: e.target.value }))} className="h-10 w-full rounded-lg bg-muted px-3 text-sm">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {phase === "uploading" && (
              <div className="pt-2">
                <CircularProgress percentage={uploadProgress} size={120} />
              </div>
            )}

            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Generate one subject per request. Re-run this form for ENGLISH and MATHS separately; the backend will attach both jobs to the same suite for the selected division.
            </div>

            <button onClick={handleLaunch} disabled={isLaunching} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {isLaunching ? "Launching..." : `Generate ${params.subject}`}
            </button>
          </div>
        </div>

        {jobs.length > 0 && (
          <div className="rounded-xl bg-card p-6 shadow-surface">
            <h3 className="font-semibold text-foreground">Generation Jobs</h3>
            <div className="mt-3 space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-lg bg-muted p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{job.subject}</span>
                    <span className="text-sm text-muted-foreground">{job.status}</span>
                  </div>
                  {job.errorMessage && <p className="mt-1 text-sm text-destructive">{job.errorMessage}</p>}
                </div>
              ))}
            </div>

            {phase === "monitoring" && (
              <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Monitoring jobs...</p>
            )}

            {phase === "done" && (
              <div className="mt-4 rounded-lg bg-success/10 p-3 text-sm text-success">
                <p className="inline-flex items-center gap-2"><CheckCircle size={16} /> Current job monitoring completed.</p>
                {completedSuiteId && (
                  <div className="mt-3">
                    <Link to={`/teacher/baseline-suites/${completedSuiteId}`} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                      Open Suite and Create LSA
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button onClick={() => navigate("/teacher/tests")} className="text-sm text-muted-foreground hover:text-foreground">Back to tests</button>
      </div>
    </div>
  );
}
