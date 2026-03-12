import { LoginForm } from "@/components/forms/LoginForm";
import { adminApi } from "@/api/adminApi";

export default function AdminLoginPage() {
  return (
    <LoginForm
      role="admin"
      title="Admin Sign In"
      subtitle="Manage schools, classes, and the entire platform."
      fields={[
        { name: "email", label: "Email", type: "email", placeholder: "admin@customized.edu" },
        { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
      ]}
      onSubmit={async (data) => {
        const res = await adminApi.login({ email: data.email, password: data.password });
        const { admin, token } = res.data.data;
        return { token, id: admin.id, name: admin.name };
      }}
      otherLogins={[
        { label: "Teacher", path: "/teacher/login", role: "teacher" },
        { label: "Student", path: "/student/login", role: "student" },
        { label: "Parent", path: "/parent/login", role: "parent" },
      ]}
    />
  );
}
