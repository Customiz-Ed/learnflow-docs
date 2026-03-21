import api from "./axios";
import type {
  ApiResponse,
  TriggerSubjectLessonPlanRequest,
  TriggerSubjectLessonPlanData,
  TeacherStudentLessonPlansData,
} from "@/types/api.types";

export const lessonPlanApi = {
  /**
   * Trigger a lesson plan generation for a specific subject and student
   * @param payload - Contains studentId, suiteId, and subject (ENGLISH or MATHS)
   * @returns Job details with status and callback URL
   */
  triggerSubject: (payload: TriggerSubjectLessonPlanRequest) =>
    api.post<ApiResponse<TriggerSubjectLessonPlanData>>(
      "/lesson-plans/trigger/subject",
      payload,
    ),

  /**
   * Get lesson plans for a teacher's student
   * @param studentId - The ID of the student
   * @param params - Optional query parameters:
   *   - suiteId: Filter to a specific baseline suite
   *   - includeContent: Whether to include markdown and structured summary content (false by default for fast load)
   * @returns Student info and array of subject-specific lesson plan summaries
   */
  getTeacherStudentLessonPlans: (
    studentId: string,
    params?: { suiteId?: string; includeContent?: boolean },
  ) =>
    api.get<ApiResponse<TeacherStudentLessonPlansData>>(
      `/lesson-plans/teacher/students/${studentId}`,
      { params },
    ),
};
