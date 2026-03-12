import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { testApi } from "@/api/testApi";
import { classApi } from "@/api/classApi";
import { teacherApi } from "@/api/teacherApi";
import { PageHeader } from "@/components/ui/page-helpers";
import { CircularProgress } from "@/components/ui/circular-progress";
import { motion } from "framer-motion";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type UploadPhase = "idle" | "uploading" | "generating" | "success" | "error";

interface UploadUrlResponse {
  uploadUrl: string | null;
  key: string;
  bucket: string;
  alreadyExists: boolean;
}

interface BaselineGenerationJobResponse {
  id: string;
  status: "QUEUED" | "PROCESSING";
}

interface BaselineGenerationJobStatus {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage?: string;
  generatedTestId?: string;
}

export default function TeacherGenerateBaselineTest() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobStatus, setJobStatus] = useState<BaselineGenerationJobStatus["status"] | "">("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const s3KeyCache = useRef(new Map<string, string>());

  const [params, setParams] = useState({
    grade: "",
    subject: "",
    classId: "",
    divisionId: "",
    testName: "",
    numberOfQuestions: "10",
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
  const getUrlMutation = useMutation({
    mutationFn: async (payload: { fileName: string; fileHash: string }) => {
      const res = await testApi.getUploadUrl(payload);
      return res.data.data;
    },
    onSuccess: async (data: UploadUrlResponse, variables: { fileName: string; fileHash: string }) => {
      if (!file) return;

      try {
        s3KeyCache.current.set(variables.fileHash, data.key);

        if (!data.alreadyExists) {
          // Step 2: Upload to S3 with progress
          setPhase("uploading");
          await uploadToS3(file, data);
        } else {
          setUploadProgress(100);
          toast.success("File already exists in storage. Reusing existing upload.");
        }

        // Step 3: Generate test
        await startGeneration(data.key);
      } catch (err: any) {
        setPhase("error");
        setErrorMsg(err.message || "Upload failed");
        toast.error(err.message || "Upload failed");
      }
    },
    onError: (err: any) => {
      setPhase("error");
      const msg = err.response?.data?.message || "Failed to get upload URL";
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  // Generate test from S3
  const generateMutation = useMutation({
    mutationFn: async (s3Key: string) => {
      const res = await testApi.generateBaselineFromS3({
        s3Key,
        grade: params.grade,
        subject: params.subject,
        classId: params.classId,
        divisionId: params.divisionId,
        testName: params.testName || undefined,
        numberOfQuestions: Number(params.numberOfQuestions),
        difficulty: params.difficulty,
      });
      return res.data;
    },
  });

  const { data: jobData } = useQuery({
    queryKey: ["baseline-generation-job", jobId],
    queryFn: () => testApi.getBaselineGenerationJob(jobId).then((r) => r.data.data),
    enabled: !!jobId && phase === "generating",
    refetchInterval: (query) => {
      const status = (query.state.data as BaselineGenerationJobStatus | undefined)?.status;
      return status === "QUEUED" || status === "PROCESSING" ? 3000 : false;
    },
  });

  useEffect(() => {
    if (!jobData) return;

    setJobStatus(jobData.status);

    if (jobData.status === "QUEUED") {
      setGenerationProgress((p) => Math.max(p, 20));
      return;
    }

    if (jobData.status === "PROCESSING") {
      setGenerationProgress((p) => Math.min(p + 10, 90));
      return;
    }

    if (jobData.status === "COMPLETED") {
      setGenerationProgress(100);
      setPhase("success");
      return;
    }

    if (jobData.status === "FAILED") {
      setPhase("error");
      const msg = jobData.errorMessage || "Test generation failed";
      setErrorMsg(msg);
      toast.error(msg);
    }
  }, [jobData]);

  // Upload file to S3 with fetch progress
  const uploadToS3 = async (file: File, presignedData: UploadUrlResponse) => {
    return new Promise<void>((resolve, reject) => {
      if (!presignedData.uploadUrl) {
        reject(new Error("Upload URL is missing"));
        return;
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          resolve();
        } else {
          reject(new Error("S3 upload failed"));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("PUT", presignedData.uploadUrl);
      xhr.setRequestHeader("Content-Type", "application/pdf");
      xhr.send(file);
    });
  };

  const computeSHA256 = async (selectedFile: File) => {
    const arrayBuffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const startGeneration = async (s3Key: string) => {
    try {
      setPhase("generating");
      setGenerationProgress(15);
      const response = await generateMutation.mutateAsync(s3Key);
      setJobId(response.data.id);
      setJobStatus(response.data.status);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Test generation failed");
    }
  };

  const handleStart = async () => {
    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }

    if (!params.grade || !params.subject || !params.classId || !params.divisionId) {
      toast.error("Grade, Subject, Class, and Division are required");
      return;
    }

    setUploadProgress(0);
    setGenerationProgress(0);
    setErrorMsg("");
    setJobId("");
    setJobStatus("");

    try {
      const fileHash = await computeSHA256(file);
      const cachedS3Key = s3KeyCache.current.get(fileHash);

      if (cachedS3Key) {
        toast.success("Using previously uploaded file from this session.");
        await startGeneration(cachedS3Key);
        return;
      }

      setPhase("uploading");
      getUrlMutation.mutate({ fileName: file.name, fileHash });
    } catch {
      setPhase("error");
      const msg = "Failed to hash file before upload";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadProgress(0);
    setGenerationProgress(0);
    setPhase("idle");
    setErrorMsg("");
    setJobId("");
    setJobStatus("");
  };

  const handleNavigateToDashboard = () => {
    navigate("/teacher/tests");
  };

  return (
    <div>
      <PageHeader
        title="Generate Baseline Test"
        description="Upload a curriculum PDF to auto-generate test questions"
      />

      <div className="mx-auto max-w-2xl">
        {phase === "idle" || phase === "error" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 rounded-xl bg-card p-8 shadow-surface"
          >
            {/* File Upload */}
            <div>
              <label className="mb-4 block text-heading-3 font-semibold text-foreground">
                Upload Curriculum PDF
              </label>
              <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center transition-colors hover:border-primary/50">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload size={32} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {file ? file.name : "Click or drag PDF file here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF files up to 200 MB
                  </p>
                </div>
              </div>
            </div>

            {/* Test Parameters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Test Parameters</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Grade *
                  </label>
                  <select
                    value={params.grade}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, grade: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select grade</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Subject *
                  </label>
                  <select
                    value={params.subject}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, subject: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Geography">Geography</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Class *
                  </label>
                  <select
                    value={params.classId}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, classId: e.target.value, divisionId: "" }))
                    }
                    className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select class</option>
                    {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Division *
                  </label>
                  <select
                    value={params.divisionId}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, divisionId: e.target.value }))
                    }
                    disabled={!params.classId}
                    className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Select division</option>
                    {divisions?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={params.numberOfQuestions}
                    onChange={(e) =>
                      setParams((p) => ({
                        ...p,
                        numberOfQuestions: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Difficulty Level
                  </label>
                  <select
                    value={params.difficulty}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, difficulty: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Test Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Midterm Exam"
                    value={params.testName}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, testName: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {phase === "error" && errorMsg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 rounded-lg bg-destructive/10 p-4 text-destructive"
              >
                <AlertCircle size={20} className="flex-shrink-0" />
                <div>
                  <p className="font-medium">Upload failed</p>
                  <p className="text-sm">{errorMsg}</p>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStart}
                disabled={getUrlMutation.isPending}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {getUrlMutation.isPending ? "Starting..." : "Generate Test"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleReset}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Clear
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-8 rounded-xl bg-card p-8 shadow-surface"
          >
            {phase === "uploading" && (
              <>
                <CircularProgress percentage={uploadProgress} size={140} />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Uploading PDF to cloud...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}% complete
                  </p>
                </div>
              </>
            )}

            {phase === "generating" && (
              <>
                <CircularProgress percentage={generationProgress} size={140} />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Generating test questions...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {jobStatus === "QUEUED" ? "Job is queued" : "Job is processing"}
                  </p>
                </div>
              </>
            )}

            {phase === "success" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <CheckCircle size={64} className="text-success" />
                </motion.div>
                <div className="text-center">
                  <p className="text-heading-3 font-semibold text-foreground">
                    Test Generated Successfully!
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your baseline test is ready to use
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNavigateToDashboard}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  Go to Tests
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
