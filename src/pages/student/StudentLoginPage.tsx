import { LoginForm } from "@/components/forms/LoginForm";
import { studentApi } from "@/api/studentApi";

export default function StudentLoginPage() {
  return (
    <LoginForm
      role="student"
      title="Student Sign In"
      subtitle="Access your tests, reports, and learning dashboard."
      fields={[
        { name: "username", label: "Username", type: "text", placeholder: "your_username" },
        { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
      ]}
      onSubmit={async (data) => {
        const res = await studentApi.login({ username: data.username, password: data.password });
        const { student, token, requiresPasswordChange } = res.data.data;
        const mustChangePassword = Boolean(requiresPasswordChange ?? student.requiresPasswordChange);
        localStorage.setItem("studentRequiresPasswordChange", mustChangePassword ? "true" : "false");
        return {
          token,
          id: student.id,
          name: student.name,
          redirectTo: mustChangePassword ? "/student/change-password" : "/student/dashboard",
        };
      }}
      registerLink={{ label: "Create an account", path: "/student/register" }}
      otherLogins={[
        { label: "Admin", path: "/admin/login", role: "admin" },
        { label: "Teacher", path: "/teacher/login", role: "teacher" },
        { label: "Parent", path: "/parent/login", role: "parent" },
      ]}
    />
  );
}
