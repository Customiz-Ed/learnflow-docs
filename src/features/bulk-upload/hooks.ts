import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getSchoolClasses,
  getClassDivisions,
  uploadStudentsAdmin,
  uploadStudentsTeacher,
} from "./api";
import type {
  AdminBulkUploadInput,
  TeacherBulkUploadInput,
  ApiError,
} from "./types";

function getErrorMessage(err: unknown): string {
  const e = err as ApiError;
  return e?.message ?? "Something went wrong";
}

export function useSchoolClasses(schoolId: string | undefined, token: string | undefined) {
  return useQuery({
    queryKey: ["school-classes", schoolId],
    queryFn: () => getSchoolClasses(schoolId as string, token as string),
    enabled: Boolean(schoolId && token),
    staleTime: 30000,
  });
}

export function useClassDivisions(classId: string | undefined, token: string | undefined) {
  return useQuery({
    queryKey: ["class-divisions", classId],
    queryFn: () => getClassDivisions(classId as string, token as string),
    enabled: Boolean(classId && token),
    staleTime: 30000,
  });
}

export function useAdminBulkUpload(token: string | undefined) {
  return useMutation({
    mutationFn: (input: AdminBulkUploadInput) =>
      uploadStudentsAdmin(input, token as string),
    onError: (err) => {
      console.error("Admin upload failed:", getErrorMessage(err));
    },
  });
}

export function useTeacherBulkUpload(token: string | undefined) {
  return useMutation({
    mutationFn: (input: TeacherBulkUploadInput) =>
      uploadStudentsTeacher(input, token as string),
    onError: (err) => {
      console.error("Teacher upload failed:", getErrorMessage(err));
    },
  });
}

export function useUploadEligibility(params: {
  mode: "admin" | "teacher";
  file?: File | null;
  schoolId?: string;
  classId?: string;
  divisionId?: string;
}) {
  return useMemo(() => {
    const hasValidFile =
      Boolean(params.file) &&
      Boolean(params.file?.name.match(/\.(xlsx|xls)$/i)) &&
      Number(params.file?.size ?? 0) <= 5 * 1024 * 1024;

    if (params.mode === "teacher") {
      return {
        canUpload: Boolean(params.divisionId && hasValidFile),
        hasValidFile,
      };
    }

    return {
      canUpload: Boolean(params.schoolId && params.classId && params.divisionId && hasValidFile),
      hasValidFile,
    };
  }, [params]);
}
