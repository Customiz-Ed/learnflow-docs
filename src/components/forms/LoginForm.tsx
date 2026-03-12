import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { GraduationCap, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/types/api.types";

interface AuthField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
}

interface LoginFormProps {
  role: Role;
  title: string;
  subtitle: string;
  fields: AuthField[];
  onSubmit: (data: Record<string, string>) => Promise<{ token: string; id: string; name: string }>;
  registerLink?: { label: string; path: string };
  otherLogins?: Array<{ label: string; path: string; role: string }>;
}

export function LoginForm({ role, title, subtitle, fields, onSubmit, registerLink, otherLogins }: LoginFormProps) {
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
      toast.success("Welcome back!");
      navigate(`/${role}/dashboard`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
            <GraduationCap size={24} className="text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-primary-foreground">CustomizEd</span>
        </div>
        <div>
          <h2 className="text-heading-1 font-bold text-primary-foreground">
            Focus on what matters.
          </h2>
          <p className="mt-4 max-w-md text-lg text-primary-foreground/80">
            An AI-powered adaptive education platform that personalizes learning for every student.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">© 2026 CustomizEd. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap size={20} className="text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">CustomizEd</span>
          </div>

          <h1 className="text-heading-2 font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-body text-muted-foreground">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="mb-2 block text-sm font-medium text-foreground">
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
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {registerLink && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to={registerLink.path} className="font-medium text-primary hover:underline">
                {registerLink.label}
              </Link>
            </p>
          )}

          {otherLogins && otherLogins.length > 0 && (
            <div className="mt-8 border-t border-border pt-6">
              <p className="mb-3 text-center text-xs text-muted-foreground">Sign in as a different role</p>
              <div className="flex flex-wrap justify-center gap-2">
                {otherLogins.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
