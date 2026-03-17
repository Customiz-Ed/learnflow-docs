import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { catalogApi } from "@/api/catalogApi";
import { studentApi } from "@/api/studentApi";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import type { CatalogSchool, CatalogClass, CatalogDivision } from "@/types/api.types";

export default function StudentRegisterPage() {
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<CatalogSchool[]>([]);
  const [classes, setClasses] = useState<CatalogClass[]>([]);
  const [divisions, setDivisions] = useState<CatalogDivision[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [formData, setFormData] = useState({ username: "", name: "", password: "", age: "", grade: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    catalogApi.getSchools().then((res) => setSchools(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      catalogApi.getSchoolClasses(selectedSchool).then((res) => setClasses(res.data.data));
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedClass) {
      catalogApi.getClassDivisions(selectedClass).then((res) => setDivisions(res.data.data));
    }
  }, [selectedClass]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await studentApi.register({
        username: formData.username,
        name: formData.name,
        password: formData.password,
        age: formData.age ? parseInt(formData.age) : undefined,
        grade: parseInt(formData.grade),
        schoolId: selectedSchool,
        divisionId: selectedDivision,
      });
      const { student, token } = res.data.data;
      login(token, "student", student.id, student.name);
      toast.success("Account created! Your enrollment request is pending.");
      navigate("/student/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["School", "Class", "Division", "Details"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Link to="/student/login" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="rounded-xl bg-card p-8 shadow-surface-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg">
              <img src="/customized.png" alt="CustomizEd Logo" className="h-full w-full rounded-sm object-cover" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Student Registration</span>
          </div>

          {/* Progress */}
          <div className="mb-8 flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i + 1 < step ? "bg-primary text-primary-foreground" :
                  i + 1 === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i + 1 < step ? <Check size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full transition-colors ${i + 1 < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepPanel key="s1" title="Select your school">
                <div className="space-y-2">
                  {schools.length === 0 && <p className="text-sm text-muted-foreground">Loading schools...</p>}
                  {schools.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSchool(s.id); setStep(2); }}
                      className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                        selectedSchool === s.id ? "bg-primary/10 text-primary ring-2 ring-primary" : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </StepPanel>
            )}

            {step === 2 && (
              <StepPanel key="s2" title="Select your class">
                <div className="space-y-2">
                  {classes.length === 0 && <p className="text-sm text-muted-foreground">No classes found for this school.</p>}
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedClass(c.id); setStep(3); }}
                      className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                        selectedClass === c.id ? "bg-primary/10 text-primary ring-2 ring-primary" : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={14} className="mr-1 inline" /> Back
                </button>
              </StepPanel>
            )}

            {step === 3 && (
              <StepPanel key="s3" title="Select your division">
                <div className="space-y-2">
                  {divisions.length === 0 && <p className="text-sm text-muted-foreground">No divisions found.</p>}
                  {divisions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => { setSelectedDivision(d.id); setStep(4); }}
                      className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                        selectedDivision === d.id ? "bg-primary/10 text-primary ring-2 ring-primary" : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(2)} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={14} className="mr-1 inline" /> Back
                </button>
              </StepPanel>
            )}

            {step === 4 && (
              <StepPanel key="s4" title="Your details">
                <div className="space-y-4">
                  {[
                    { name: "name", label: "Full Name", type: "text", placeholder: "Alex Johnson" },
                    { name: "username", label: "Username", type: "text", placeholder: "alex_j" },
                    { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
                    { name: "grade", label: "Grade", type: "number", placeholder: "5" },
                    { name: "age", label: "Age (optional)", type: "number", placeholder: "10" },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        required={f.name !== "age"}
                        value={(formData as any)[f.name]}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [f.name]: e.target.value }))}
                        className="h-11 w-full rounded-lg bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                      />
                    </div>
                  ))}

                  <motion.button
                    onClick={handleSubmit}
                    disabled={loading || !formData.username || !formData.name || !formData.password || !formData.grade}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-shadow hover:shadow-surface-md disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    ) : (
                      <>Create account <ArrowRight size={18} /></>
                    )}
                  </motion.button>
                </div>
                <button onClick={() => setStep(3)} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={14} className="mr-1 inline" /> Back
                </button>
              </StepPanel>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function StepPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
    >
      <h3 className="mb-4 text-heading-3 font-semibold text-foreground">{title}</h3>
      {children}
    </motion.div>
  );
}
