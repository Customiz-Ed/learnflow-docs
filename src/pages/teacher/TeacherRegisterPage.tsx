import { useState, useEffect } from "react";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { teacherApi } from "@/api/teacherApi";
import { catalogApi } from "@/api/catalogApi";
import type { CatalogSchool } from "@/types/api.types";

export default function TeacherRegisterPage() {
  const [schools, setSchools] = useState<CatalogSchool[]>([]);

  useEffect(() => {
    catalogApi.getSchools().then((res) => setSchools(res.data.data));
  }, []);

  return (
    <RegisterForm
      role="teacher"
      title="Create Teacher Account"
      subtitle="Join a school and start managing your classes."
      fields={[
        { name: "name", label: "Full Name", type: "text", placeholder: "Jane Smith" },
        { name: "email", label: "Email", type: "email", placeholder: "jane@school.edu" },
        { name: "phone", label: "Phone", type: "tel", placeholder: "+1 234 567 8900" },
        { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
        {
          name: "schoolId",
          label: "School",
          type: "search-select",
          placeholder: "Type school name to search...",
          options: schools.map((school) => ({
            label: school.name,
            value: school.id,
          })),
        },
      ]}
      onSubmit={async (data) => {
        const res = await teacherApi.register({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          schoolId: data.schoolId,
        });
        const { teacher, token } = res.data.data;
        return { token, id: teacher.id, name: teacher.name };
      }}
      loginLink={{ label: "Sign in", path: "/teacher/login" }}
    />
  );
}
