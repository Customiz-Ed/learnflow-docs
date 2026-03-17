import type {
  ApiError,
  ApiSuccess,
  BulkUploadData,
  SchoolClassOption,
  DivisionOption,
  AdminBulkUploadInput,
  TeacherBulkUploadInput,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function parseJson<T>(res: Response): Promise<T> {
  const json = await res.json();
  return json as T;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return parseJson<T>(res);
  }
  const err = await parseJson<ApiError>(res);
  throw err;
}

export async function getSchoolClasses(
  schoolId: string,
  token: string,
): Promise<SchoolClassOption[]> {
  const res = await fetch(`${API_BASE}/catalog/schools/${schoolId}/classes`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await handleResponse<ApiSuccess<SchoolClassOption[]>>(res);
  return payload.data;
}

export async function getClassDivisions(
  classId: string,
  token: string,
): Promise<DivisionOption[]> {
  const res = await fetch(`${API_BASE}/catalog/classes/${classId}/divisions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await handleResponse<ApiSuccess<DivisionOption[]>>(res);
  return payload.data;
}

export async function uploadStudentsAdmin(
  input: AdminBulkUploadInput,
  token: string,
): Promise<BulkUploadData> {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("classId", input.classId);
  formData.append("divisionId", input.divisionId);

  const res = await fetch(`${API_BASE}/admin/schools/${input.schoolId}/students/bulk-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await handleResponse<ApiSuccess<BulkUploadData>>(res);
  return payload.data;
}

export async function uploadStudentsTeacher(
  input: TeacherBulkUploadInput,
  token: string,
): Promise<BulkUploadData> {
  const formData = new FormData();
  formData.append("file", input.file);

  const res = await fetch(`${API_BASE}/divisions/${input.divisionId}/students/bulk-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await handleResponse<ApiSuccess<BulkUploadData>>(res);
  return payload.data;
}

export function getAdminTemplateUrl(schoolId: string): string {
  return `${API_BASE}/admin/schools/${schoolId}/students/bulk-upload/template`;
}

export function getTeacherTemplateUrl(divisionId: string): string {
  return `${API_BASE}/divisions/${divisionId}/students/bulk-upload/template`;
}
