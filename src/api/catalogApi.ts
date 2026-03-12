import api from "./axios";
import type { ApiResponse, CatalogSchool, CatalogClass, CatalogDivision } from "@/types/api.types";

export const catalogApi = {
  getSchools: () =>
    api.get<ApiResponse<CatalogSchool[]>>("/catalog/schools"),

  getSchoolClasses: (schoolId: string) =>
    api.get<ApiResponse<CatalogClass[]>>(`/catalog/schools/${schoolId}/classes`),

  getSchoolDivisions: (schoolId: string) =>
    api.get<ApiResponse<CatalogDivision[]>>(`/catalog/schools/${schoolId}/divisions`),

  getClassDivisions: (classId: string) =>
    api.get<ApiResponse<CatalogDivision[]>>(`/catalog/classes/${classId}/divisions`),
};
