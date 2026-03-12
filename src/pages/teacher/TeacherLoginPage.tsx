import { LoginForm } from "@/components/forms/LoginForm";
import { teacherApi } from "@/api/teacherApi";

export default function TeacherLoginPage() {
  return (
    <LoginForm
      role="teacher"
      title="Teacher Sign In"
      subtitle="Manage your students, tests, and enrollments."
      fields={[
        { name: "email", label: "Email", type: "email", placeholder: "teacher@school.edu" },
        { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
      ]}
      onSubmit={async (data) => {
        const res = await teacherApi.login({ email: data.email, password: data.password });
        const { teacher, token } = res.data.data;
        return { token, id: teacher.id, name: teacher.name };
      }}
      registerLink={{ label: "Create an account", path: "/teacher/register" }}
      otherLogins={[
        { label: "Admin", path: "/admin/login", role: "admin" },
        { label: "Student", path: "/student/login", role: "student" },
        { label: "Parent", path: "/parent/login", role: "parent" },
      ]}
    />
  );
}
