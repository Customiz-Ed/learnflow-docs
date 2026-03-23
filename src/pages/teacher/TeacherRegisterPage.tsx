import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { teacherApi } from "@/api/teacherApi";
import { catalogApi } from "@/api/catalogApi";
import { schoolApi } from "@/api/schoolApi";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import type { CatalogSchool } from "@/types/api.types";

type TeacherRegisterFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

type NewSchoolFormState = {
  name: string;
  city: string;
  state: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
};

export default function TeacherRegisterPage() {
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<CatalogSchool[]>([]);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolSource, setSelectedSchoolSource] = useState<"existing" | "created" | null>(null);
  const [teacherForm, setTeacherForm] = useState<TeacherRegisterFormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [schoolForm, setSchoolForm] = useState<NewSchoolFormState>({
    name: "",
    city: "",
    state: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [creatingSchool, setCreatingSchool] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    catalogApi.getSchools().then((res) => setSchools(res.data.data)).catch(() => {
      toast.error("Unable to load schools");
    });
  }, []);

  const filteredSchools = schools
    .filter((school) => school.name.toLowerCase().includes(schoolQuery.trim().toLowerCase()))
    .slice(0, 10);

  const handleCreateSchool = async () => {
    if (!schoolForm.name.trim()) {
      toast.error("School name is required");
      return;
    }

    setCreatingSchool(true);
    try {
      const res = await schoolApi.create({
        name: schoolForm.name.trim(),
        city: schoolForm.city.trim() || undefined,
        state: schoolForm.state.trim() || undefined,
        address: schoolForm.address.trim() || undefined,
        contactEmail: schoolForm.contactEmail.trim() || undefined,
        contactPhone: schoolForm.contactPhone.trim() || undefined,
      });

      const newSchool = res.data.data;
      setSchools((prev) => [{ id: newSchool.id, name: newSchool.name }, ...prev]);
      setSelectedSchoolId(newSchool.id);
      setSelectedSchoolSource("created");
      setSchoolQuery(newSchool.name);
      setStep(3);
      toast.success("School registered successfully");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to register school");
      } else {
        toast.error("Failed to register school");
      }
    } finally {
      setCreatingSchool(false);
    }
  };

  const handleRegisterTeacher = async () => {
    if (!selectedSchoolId) {
      toast.error("Please select a school");
      setStep(1);
      return;
    }

    setCreatingAccount(true);
    try {
      const res = await teacherApi.register({
        name: teacherForm.name,
        email: teacherForm.email,
        phone: teacherForm.phone,
        password: teacherForm.password,
        schoolId: selectedSchoolId,
      });

      const { teacher, token } = res.data.data;
      login(token, "teacher", teacher.id, teacher.name);
      toast.success("Account created successfully!");
      navigate("/teacher/dashboard");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Registration failed");
      } else {
        toast.error("Registration failed");
      }
    } finally {
      setCreatingAccount(false);
    }
  };

  const steps = ["School", "Register School", "Teacher Details"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <Link to="/teacher/login" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="rounded-xl bg-card p-8 shadow-surface-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg">
              <img src="/customized.png" alt="CustomizEd Logo" className="h-full w-full rounded-sm object-cover" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Teacher Registration</span>
          </div>

          <div className="mb-8 flex items-center gap-2">
            {steps.map((stepLabel, i) => (
              <div key={stepLabel} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
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
              <StepPanel key="school-select" title="Step 1: Select your school">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Search School</label>
                    <input
                      type="text"
                      value={schoolQuery}
                      onChange={(e) => setSchoolQuery(e.target.value)}
                      placeholder="Type school name..."
                      className="h-11 w-full rounded-lg bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    />
                  </div>

                  <div className="max-h-64 space-y-2 overflow-auto">
                    {filteredSchools.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No school found. Use the Other option to register your school.</p>
                    ) : (
                      filteredSchools.map((school) => (
                        <button
                          key={school.id}
                          type="button"
                          onClick={() => {
                            setSelectedSchoolId(school.id);
                            setSelectedSchoolSource("existing");
                            setStep(3);
                          }}
                          className="w-full rounded-lg bg-muted px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:bg-muted/80"
                        >
                          {school.name}
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Other (My school is not listed)
                  </button>
                </div>
              </StepPanel>
            )}

            {step === 2 && (
              <StepPanel key="school-create" title="Step 2: Register your school">
                <div className="space-y-4">
                  <Field
                    label="School Name *"
                    value={schoolForm.name}
                    onChange={(value) => setSchoolForm((prev) => ({ ...prev, name: value }))}
                    placeholder="Springfield Elementary"
                  />
                  <Field
                    label="City"
                    value={schoolForm.city}
                    onChange={(value) => setSchoolForm((prev) => ({ ...prev, city: value }))}
                    placeholder="Chennai"
                  />
                  <Field
                    label="State"
                    value={schoolForm.state}
                    onChange={(value) => setSchoolForm((prev) => ({ ...prev, state: value }))}
                    placeholder="Tamil Nadu"
                  />
                  <Field
                    label="Address"
                    value={schoolForm.address}
                    onChange={(value) => setSchoolForm((prev) => ({ ...prev, address: value }))}
                    placeholder="123 Main Street"
                  />
                  <Field
                    label="Contact Email"
                    type="email"
                    value={schoolForm.contactEmail}
                    onChange={(value) => setSchoolForm((prev) => ({ ...prev, contactEmail: value }))}
                    placeholder="info@school.edu"
                  />
                  <Field
                    label="Contact Phone"
                    type="tel"
                    value={schoolForm.contactPhone}
                    onChange={(value) => setSchoolForm((prev) => ({ ...prev, contactPhone: value }))}
                    placeholder="+91 9876543210"
                  />

                  <motion.button
                    type="button"
                    onClick={handleCreateSchool}
                    disabled={creatingSchool || !schoolForm.name.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-shadow hover:shadow-surface-md disabled:opacity-50"
                  >
                    {creatingSchool ? "Registering school..." : "Register School and Continue"}
                  </motion.button>

                  <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={14} className="mr-1 inline" /> Back
                  </button>
                </div>
              </StepPanel>
            )}

            {step === 3 && (
              <StepPanel key="teacher-details" title="Step 3: Create teacher account">
                <div className="space-y-4">
                  <p className="rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
                    School selected: {schools.find((s) => s.id === selectedSchoolId)?.name || "Unknown School"}
                  </p>

                  <Field
                    label="Full Name"
                    value={teacherForm.name}
                    onChange={(value) => setTeacherForm((prev) => ({ ...prev, name: value }))}
                    placeholder="Jane Smith"
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={teacherForm.email}
                    onChange={(value) => setTeacherForm((prev) => ({ ...prev, email: value }))}
                    placeholder="jane@school.edu"
                  />
                  <Field
                    label="Phone"
                    type="tel"
                    value={teacherForm.phone}
                    onChange={(value) => setTeacherForm((prev) => ({ ...prev, phone: value }))}
                    placeholder="+1 234 567 8900"
                  />
                  <Field
                    label="Password"
                    type="password"
                    value={teacherForm.password}
                    onChange={(value) => setTeacherForm((prev) => ({ ...prev, password: value }))}
                    placeholder="••••••••"
                  />

                  <motion.button
                    type="button"
                    onClick={handleRegisterTeacher}
                    disabled={
                      creatingAccount ||
                      !teacherForm.name.trim() ||
                      !teacherForm.email.trim() ||
                      !teacherForm.phone.trim() ||
                      !teacherForm.password.trim() ||
                      !selectedSchoolId
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-shadow hover:shadow-surface-md disabled:opacity-50"
                  >
                    {creatingAccount ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    ) : (
                      <>
                        Create account
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSchoolSource === "existing") {
                        setStep(1);
                      } else {
                        setStep(2);
                      }
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft size={14} className="mr-1 inline" /> Back
                  </button>
                </div>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      />
    </div>
  );
}
