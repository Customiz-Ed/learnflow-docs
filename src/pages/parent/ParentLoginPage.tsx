import { LoginForm } from "@/components/forms/LoginForm";
import { parentApi } from "@/api/parentApi";

export default function ParentLoginPage() {
  return (
    <LoginForm
      role="parent"
      title="Parent Sign In"
      subtitle="Monitor your child's learning progress."
      fields={[
        { name: "email", label: "Email", type: "email", placeholder: "parent@email.com" },
        { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
      ]}
      onSubmit={async (data) => {
        const res = await parentApi.login({ email: data.email, password: data.password });
        const { parent, token } = res.data.data;
        return { token, id: parent.id, name: parent.name };
      }}
      registerLink={{ label: "Create an account", path: "/parent/register" }}
      otherLogins={[
        { label: "Admin", path: "/admin/login", role: "admin" },
        { label: "Teacher", path: "/teacher/login", role: "teacher" },
        { label: "Student", path: "/student/login", role: "student" },
      ]}
    />
  );
}
