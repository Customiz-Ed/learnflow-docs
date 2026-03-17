import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { studentApi } from "@/api/studentApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function StudentChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password must match.");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password.");
      return;
    }

    setLoading(true);
    try {
      const res = await studentApi.changePassword({ currentPassword, newPassword });
      const requiresPasswordChange = res.data.data.requiresPasswordChange;
      localStorage.setItem("studentRequiresPasswordChange", requiresPasswordChange ? "true" : "false");
      toast.success(res.data.message || "Password changed successfully.");
      navigate("/student/dashboard");
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to change password.");
      } else {
        toast.error("Failed to change password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            For security, you must change your temporary password before continuing.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
