import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { GraduationCap, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/types/api.types";

interface RegisterField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
}

interface RegisterFormProps {
  role: Role;
  title: string;
  subtitle: string;
  fields: RegisterField[];
  onSubmit: (data: Record<string, string>) => Promise<{ token: string; id: string; name: string }>;
  loginLink: { label: string; path: string };
}

export function RegisterForm({ role, title, subtitle, fields, onSubmit, loginLink }: RegisterFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onSubmit(formData);
      login(result.token, role, result.id, result.name);
      toast.success("Account created successfully!");
      navigate(`/${role}/dashboard`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
        className="w-full max-w-md"
      >
        <Link to={loginLink.path} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="rounded-xl bg-card p-8 shadow-surface-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap size={20} className="text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">CustomizEd</span>
          </div>

          <h1 className="text-heading-3 font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={field.type === "password" ? (showPassword ? "text" : "password") : field.type}
                    placeholder={field.placeholder}
                    required={field.required !== false}
                    value={formData[field.name] || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className="h-11 w-full rounded-lg bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-shadow hover:shadow-surface-md disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to={loginLink.path} className="font-medium text-primary hover:underline">
              {loginLink.label}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
