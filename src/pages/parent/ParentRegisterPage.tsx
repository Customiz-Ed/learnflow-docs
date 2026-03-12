import { RegisterForm } from "@/components/forms/RegisterForm";
import { parentApi } from "@/api/parentApi";

export default function ParentRegisterPage() {
  return (
    <RegisterForm
      role="parent"
      title="Create Parent Account"
      subtitle="Stay connected with your child's education."
      fields={[
        { name: "name", label: "Full Name", type: "text", placeholder: "John Smith" },
        { name: "email", label: "Email", type: "email", placeholder: "john@email.com" },
        { name: "phone", label: "Phone", type: "tel", placeholder: "+1 234 567 8900" },
        { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
      ]}
      onSubmit={async (data) => {
        const res = await parentApi.register({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
        });
        const { parent, token } = res.data.data;
        return { token, id: parent.id, name: parent.name };
      }}
      loginLink={{ label: "Sign in", path: "/parent/login" }}
    />
  );
}
