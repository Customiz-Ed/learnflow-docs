import type { TeacherEditableQuestion, TeacherTestDetail, TeacherUpdateTestPayload } from "@/features/tests/types";

type PreparedQuestion = TeacherEditableQuestion;

type EditableFormSnapshot = {
  name: string;
  description: string;
  deadline: string;
  duration: string;
  totalMarks: string;
  status: TeacherTestDetail["status"];
};

function normalizeQuestions(questions: PreparedQuestion[]): PreparedQuestion[] {
  return questions.map((question, questionIndex) => ({
    id: question.id,
    text: question.text.trim(),
    type: question.type,
    marks: question.marks,
    order: question.order || questionIndex + 1,
    options: question.options.map((option, optionIndex) => ({
      id: option.id,
      text: option.text.trim(),
      isCorrect: option.isCorrect,
      order: option.order || optionIndex + 1,
    })),
  }));
}

export function validateQuestions(questions: PreparedQuestion[]): string | null {
  if (!questions.length) {
    return "At least one question is required.";
  }

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const label = `Question ${index + 1}`;

    if (!question.text.trim()) {
      return `${label} must have text.`;
    }

    if (question.options.length < 2) {
      return `${label} must have at least 2 options.`;
    }

    if (question.options.some((option) => !option.text.trim())) {
      return `${label} has an empty option.`;
    }

    const correctCount = question.options.filter((option) => option.isCorrect).length;

    if (correctCount < 1) {
      return `${label} must have at least one correct option.`;
    }

    if (question.type === "SINGLE" && correctCount !== 1) {
      return `${label} (SINGLE) must have exactly one correct option.`;
    }
  }

  return null;
}

export function buildTeacherUpdatePayload(input: {
  currentForm: EditableFormSnapshot;
  initialForm: EditableFormSnapshot;
  preparedQuestions: PreparedQuestion[];
  initialQuestions: PreparedQuestion[];
  attemptsExist: boolean;
}): TeacherUpdateTestPayload {
  const {
    currentForm,
    initialForm,
    preparedQuestions,
    initialQuestions,
    attemptsExist,
  } = input;

  const payload: TeacherUpdateTestPayload = {};

  if (currentForm.name.trim() !== initialForm.name.trim()) {
    payload.name = currentForm.name.trim();
  }

  if (currentForm.description.trim() !== initialForm.description.trim()) {
    payload.description = currentForm.description.trim();
  }

  const normalizedCurrentDeadline = currentForm.deadline.trim();
  const normalizedInitialDeadline = initialForm.deadline.trim();
  if (normalizedCurrentDeadline !== normalizedInitialDeadline) {
    payload.deadline = normalizedCurrentDeadline
      ? new Date(normalizedCurrentDeadline).toISOString()
      : null;
  }

  if (!attemptsExist) {
    if (currentForm.status !== initialForm.status) {
      payload.status = currentForm.status;
    }

    const currentDuration = currentForm.duration.trim();
    const initialDuration = initialForm.duration.trim();
    if (currentDuration !== initialDuration) {
      payload.duration = currentDuration ? Number(currentDuration) : undefined;
    }

    const currentTotalMarks = currentForm.totalMarks.trim();
    const initialTotalMarks = initialForm.totalMarks.trim();
    if (currentTotalMarks !== initialTotalMarks) {
      payload.totalMarks = currentTotalMarks ? Number(currentTotalMarks) : undefined;
    }

    const normalizedCurrentQuestions = normalizeQuestions(preparedQuestions);
    const normalizedInitialQuestions = normalizeQuestions(initialQuestions);

    if (JSON.stringify(normalizedCurrentQuestions) !== JSON.stringify(normalizedInitialQuestions)) {
      payload.questions = normalizedCurrentQuestions;
    }
  }

  return payload;
}
