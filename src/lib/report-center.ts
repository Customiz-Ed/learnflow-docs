import type { BaselineSubject, ReportScope } from "@/types/api.types";

export type ReportGenerationStatus =
  | "READY"
  | "COMPLETED"
  | "QUEUED"
  | "VALIDATION"
  | "PROCESSING"
  | "STATUS_UPDATE"
  | "GENERATION"
  | "CALLBACK"
  | "FAILED"
  | "NOT_STARTED";
export type ReportSuiteKind = "BASELINE" | "MIDLINE" | "ENDLINE";

export interface ReportMetric {
  label: string;
  value: string;
}

export interface ReportPreview {
  id: string;
  reportScope: ReportScope;
  subject: BaselineSubject | null;
  title: string;
  status: ReportGenerationStatus;
  generatedAt: string | null;
  markdownContent: string;
  highlights: string[];
  metrics: ReportMetric[];
  summary: Record<string, unknown>;
  canTrigger: boolean;
  triggerLabel: string;
  statusMessage: string;
}

export interface ReportSuitePreview {
  id: string;
  suiteType: ReportSuiteKind;
  title: string;
  className: string;
  divisionName: string;
  academicYear: string;
  submittedSubjects: number;
  totalSubjects: number;
  reportsReady: number;
  lastGeneratedAt: string | null;
  subjectReports: ReportPreview[];
  cumulativeReport: ReportPreview;
}

export interface ReportStudentPreview {
  id: string;
  name: string;
  username: string;
  grade: number;
  age: number;
  className: string;
  divisionName: string;
  profilePhotoUrl: string | null;
  avatarCartoonUrl: string | null;
  baselineCompleted: boolean;
  latestReportAt: string | null;
  reportReadiness: number;
  suites: ReportSuitePreview[];
}

export const reportSuiteLabels: Record<ReportSuiteKind, string> = {
  BASELINE: "Baseline",
  MIDLINE: "Midline",
  ENDLINE: "Endline",
};

export const reportSubjects: BaselineSubject[] = ["ENGLISH", "MATHS", "LSA"];

const teacherReportStudentsSeed: ReportStudentPreview[] = [
  {
    id: "student-aanya",
    name: "Aanya Sharma",
    username: "aanya.sharma",
    grade: 5,
    age: 10,
    className: "Class 5",
    divisionName: "A",
    profilePhotoUrl: null,
    avatarCartoonUrl: null,
    baselineCompleted: true,
    latestReportAt: "2026-03-16T09:40:00Z",
    reportReadiness: 100,
    suites: [
      {
        id: "suite-baseline-aanya",
        suiteType: "BASELINE",
        title: "Baseline Readiness Suite",
        className: "Class 5",
        divisionName: "A",
        academicYear: "2025-2026",
        submittedSubjects: 3,
        totalSubjects: 3,
        reportsReady: 4,
        lastGeneratedAt: "2026-03-16T09:40:00Z",
        subjectReports: [
          {
            id: "report-aanya-english",
            reportScope: "SUBJECT",
            subject: "ENGLISH",
            title: "English Baseline Report",
            status: "READY",
            generatedAt: "2026-03-16T09:28:00Z",
            markdownContent: "# English Baseline Report\n\n## Performance Summary\nStrong progress in grammar, sentence structure, and vocabulary retrieval.\n\n## Priority Focus\n- Reading comprehension under time pressure\n- Evidence-based answers in longer passages\n\n## Teaching Move\nUse short close-reading drills before moving into extended passages.",
            highlights: ["Grammar accuracy is already above the class target.", "Comprehension dips when passages become multi-step."],
            metrics: [
              { label: "Score", value: "84%" },
              { label: "Strong Topics", value: "Grammar, Vocabulary" },
              { label: "Focus", value: "Comprehension" },
            ],
            summary: {
              strongTopics: [
                { topicName: "Grammar", accuracy: 94 },
                { topicName: "Vocabulary", accuracy: 88 },
              ],
              weakTopics: [{ topicName: "Comprehension", accuracy: 64 }],
              focusAreas: ["Close reading", "Inference questions"],
            },
            canTrigger: true,
            triggerLabel: "Regenerate report",
            statusMessage: "Latest subject report is ready for review.",
          },
          {
            id: "report-aanya-maths",
            reportScope: "SUBJECT",
            subject: "MATHS",
            title: "Maths Baseline Report",
            status: "READY",
            generatedAt: "2026-03-16T09:31:00Z",
            markdownContent: "# Maths Baseline Report\n\n## Performance Summary\nNumber operations and pattern recognition are secure.\n\n## Priority Focus\n- Multi-step word problems\n- Checking work before submission\n\n## Teaching Move\nModel problem translation from words to equations twice a week.",
            highlights: ["Accuracy is strongest on direct computation.", "Errors cluster around multi-step reasoning."],
            metrics: [
              { label: "Score", value: "79%" },
              { label: "Strong Topics", value: "Operations, Patterns" },
              { label: "Focus", value: "Word Problems" },
            ],
            summary: {
              strongTopics: [
                { topicName: "Operations", accuracy: 90 },
                { topicName: "Patterns", accuracy: 86 },
              ],
              weakTopics: [{ topicName: "Word Problems", accuracy: 59 }],
              focusAreas: ["Equation setup", "Step checking"],
            },
            canTrigger: true,
            triggerLabel: "Regenerate report",
            statusMessage: "Latest subject report is ready for review.",
          },
          {
            id: "report-aanya-lsa",
            reportScope: "SUBJECT",
            subject: "LSA",
            title: "Learning Style Assessment",
            status: "READY",
            generatedAt: "2026-03-16T09:34:00Z",
            markdownContent: "# Learning Style Assessment\n\n## Learning Profile\nDominant style: **VISUAL**.\n\n## What Works Best\n- Diagrams and color-coded notes\n- Sequenced worked examples\n- Visual anchors for instructions\n\n## Teaching Move\nPair new ideas with sketched models before practice begins.",
            highlights: ["Visual prompts accelerate recall.", "Student still responds well to movement-based revision."],
            metrics: [
              { label: "Dominant Style", value: "Visual" },
              { label: "Secondary", value: "Kinesthetic" },
              { label: "Confidence", value: "High" },
            ],
            summary: {
              dominantStyle: "VISUAL",
              tally: { VISUAL: 42, AUDITORY: 24, KINESTHETIC: 34 },
            },
            canTrigger: true,
            triggerLabel: "Regenerate report",
            statusMessage: "Learning profile report is ready.",
          },
        ],
        cumulativeReport: {
          id: "report-aanya-cumulative",
          reportScope: "CUMULATIVE",
          subject: null,
          title: "Comprehensive Baseline Report",
          status: "READY",
          generatedAt: "2026-03-16T09:40:00Z",
          markdownContent: "# Comprehensive Baseline Report\n\n## Cross-Subject View\nAanya shows strong foundational accuracy and responds best when new material is visually structured.\n\n## Best Next Step\nCombine comprehension work with visual annotation and math word-problem translation routines.\n\n## Teacher Recommendation\nKeep baseline supports and reassess at midline.",
          highlights: ["The strongest cross-subject pattern is visual processing.", "Comprehension and word-problem reasoning should be coached together."],
          metrics: [
            { label: "Subjects Ready", value: "4/4" },
            { label: "Overall Trend", value: "Secure foundation" },
            { label: "Next Milestone", value: "Midline suite" },
          ],
          summary: {
            crossSubjectAnalysis: { ENGLISH: 84, MATHS: 79 },
            integratedInsights: ["Visual scaffolds improve performance in both English and Maths."],
          },
          canTrigger: true,
          triggerLabel: "Regenerate cumulative",
          statusMessage: "Cumulative narrative is ready.",
        },
      },
      {
        id: "suite-midline-aanya",
        suiteType: "MIDLINE",
        title: "Midline Growth Suite",
        className: "Class 5",
        divisionName: "A",
        academicYear: "2025-2026",
        submittedSubjects: 0,
        totalSubjects: 3,
        reportsReady: 0,
        lastGeneratedAt: null,
        subjectReports: [
          {
            id: "report-aanya-midline-english",
            reportScope: "SUBJECT",
            subject: "ENGLISH",
            title: "English Midline Report",
            status: "NOT_STARTED",
            generatedAt: null,
            markdownContent: "",
            highlights: ["Waiting for the midline English attempt."],
            metrics: [{ label: "Status", value: "Not submitted" }],
            summary: {},
            canTrigger: false,
            triggerLabel: "Generate report",
            statusMessage: "Report can be generated after the student submits this subject.",
          },
          {
            id: "report-aanya-midline-maths",
            reportScope: "SUBJECT",
            subject: "MATHS",
            title: "Maths Midline Report",
            status: "NOT_STARTED",
            generatedAt: null,
            markdownContent: "",
            highlights: ["Waiting for the midline Maths attempt."],
            metrics: [{ label: "Status", value: "Not submitted" }],
            summary: {},
            canTrigger: false,
            triggerLabel: "Generate report",
            statusMessage: "Report can be generated after the student submits this subject.",
          },
          {
            id: "report-aanya-midline-lsa",
            reportScope: "SUBJECT",
            subject: "LSA",
            title: "LSA Midline Report",
            status: "NOT_STARTED",
            generatedAt: null,
            markdownContent: "",
            highlights: ["Waiting for the midline learning style check-in."],
            metrics: [{ label: "Status", value: "Not submitted" }],
            summary: {},
            canTrigger: false,
            triggerLabel: "Generate report",
            statusMessage: "Report can be generated after the student submits this subject.",
          },
        ],
        cumulativeReport: {
          id: "report-aanya-midline-cumulative",
          reportScope: "CUMULATIVE",
          subject: null,
          title: "Midline Comprehensive Report",
          status: "NOT_STARTED",
          generatedAt: null,
          markdownContent: "",
          highlights: ["This becomes available after all three midline subject reports are ready."],
          metrics: [{ label: "Status", value: "Locked" }],
          summary: {},
          canTrigger: false,
          triggerLabel: "Generate cumulative",
          statusMessage: "Cumulative report requires all subject attempts first.",
        },
      },
    ],
  },
  {
    id: "student-kabir",
    name: "Kabir Mehta",
    username: "kabir.mehta",
    grade: 6,
    age: 11,
    className: "Class 6",
    divisionName: "B",
    profilePhotoUrl: null,
    avatarCartoonUrl: null,
    baselineCompleted: false,
    latestReportAt: "2026-03-17T08:15:00Z",
    reportReadiness: 35,
    suites: [
      {
        id: "suite-baseline-kabir",
        suiteType: "BASELINE",
        title: "Baseline Readiness Suite",
        className: "Class 6",
        divisionName: "B",
        academicYear: "2025-2026",
        submittedSubjects: 2,
        totalSubjects: 3,
        reportsReady: 1,
        lastGeneratedAt: "2026-03-17T08:15:00Z",
        subjectReports: [
          {
            id: "report-kabir-english",
            reportScope: "SUBJECT",
            subject: "ENGLISH",
            title: "English Baseline Report",
            status: "READY",
            generatedAt: "2026-03-17T08:15:00Z",
            markdownContent: "# English Baseline Report\n\n## Performance Summary\nKabir writes confidently and attempts every question.\n\n## Priority Focus\n- Inference-based reading questions\n- Evidence selection from passages\n\n## Teaching Move\nShift from general reading practice to answer-justification drills.",
            highlights: ["Student engagement is high.", "Reading inference accuracy still needs explicit coaching."],
            metrics: [
              { label: "Score", value: "71%" },
              { label: "Strong Topics", value: "Vocabulary" },
              { label: "Focus", value: "Inference" },
            ],
            summary: {
              strongTopics: [{ topicName: "Vocabulary", accuracy: 83 }],
              weakTopics: [{ topicName: "Inference", accuracy: 56 }],
              focusAreas: ["Justifying answers", "Passage annotation"],
            },
            canTrigger: true,
            triggerLabel: "Regenerate report",
            statusMessage: "English report is ready.",
          },
          {
            id: "report-kabir-maths",
            reportScope: "SUBJECT",
            subject: "MATHS",
            title: "Maths Baseline Report",
            status: "PROCESSING",
            generatedAt: null,
            markdownContent: "",
            highlights: ["The Maths attempt is submitted and the report job is still running."],
            metrics: [{ label: "Queue State", value: "Processing" }],
            summary: {},
            canTrigger: true,
            triggerLabel: "Generate report",
            statusMessage: "Lambda is still generating the Maths narrative.",
          },
          {
            id: "report-kabir-lsa",
            reportScope: "SUBJECT",
            subject: "LSA",
            title: "Learning Style Assessment",
            status: "NOT_STARTED",
            generatedAt: null,
            markdownContent: "",
            highlights: ["LSA has not been submitted yet."],
            metrics: [{ label: "Status", value: "Awaiting submission" }],
            summary: {},
            canTrigger: false,
            triggerLabel: "Generate report",
            statusMessage: "The student still needs to take the LSA test.",
          },
        ],
        cumulativeReport: {
          id: "report-kabir-cumulative",
          reportScope: "CUMULATIVE",
          subject: null,
          title: "Comprehensive Baseline Report",
          status: "NOT_STARTED",
          generatedAt: null,
          markdownContent: "",
          highlights: ["The cumulative report remains locked until all three subjects are submitted."],
          metrics: [{ label: "Ready Subjects", value: "1/3" }],
          summary: {},
          canTrigger: false,
          triggerLabel: "Generate cumulative",
          statusMessage: "All subject attempts are required before cumulative generation.",
        },
      },
    ],
  },
  {
    id: "student-meera",
    name: "Meera Nair",
    username: "meera.nair",
    grade: 5,
    age: 10,
    className: "Class 5",
    divisionName: "C",
    profilePhotoUrl: null,
    avatarCartoonUrl: null,
    baselineCompleted: true,
    latestReportAt: "2026-03-17T07:10:00Z",
    reportReadiness: 75,
    suites: [
      {
        id: "suite-baseline-meera",
        suiteType: "BASELINE",
        title: "Baseline Readiness Suite",
        className: "Class 5",
        divisionName: "C",
        academicYear: "2025-2026",
        submittedSubjects: 3,
        totalSubjects: 3,
        reportsReady: 3,
        lastGeneratedAt: "2026-03-17T07:10:00Z",
        subjectReports: [
          {
            id: "report-meera-english",
            reportScope: "SUBJECT",
            subject: "ENGLISH",
            title: "English Baseline Report",
            status: "READY",
            generatedAt: "2026-03-17T07:02:00Z",
            markdownContent: "# English Baseline Report\n\n## Performance Summary\nReading fluency is strong and vocabulary depth is above grade expectation.\n\n## Priority Focus\n- Open-response structure\n- Proofreading after writing\n\n## Teaching Move\nUse sentence frames before independent paragraph writing.",
            highlights: ["Fluency is a strength.", "Written response structure needs routine support."],
            metrics: [
              { label: "Score", value: "82%" },
              { label: "Strong Topics", value: "Fluency, Vocabulary" },
              { label: "Focus", value: "Written Response" },
            ],
            summary: {
              strongTopics: [{ topicName: "Fluency", accuracy: 91 }],
              weakTopics: [{ topicName: "Written Response", accuracy: 61 }],
              focusAreas: ["Paragraph organization"],
            },
            canTrigger: true,
            triggerLabel: "Regenerate report",
            statusMessage: "English report is ready.",
          },
          {
            id: "report-meera-maths",
            reportScope: "SUBJECT",
            subject: "MATHS",
            title: "Maths Baseline Report",
            status: "READY",
            generatedAt: "2026-03-17T07:05:00Z",
            markdownContent: "# Maths Baseline Report\n\n## Performance Summary\nComputation is reliable and pace is consistent.\n\n## Priority Focus\n- Fraction equivalence\n- Showing method clearly\n\n## Teaching Move\nUse worked examples with explicit method annotation.",
            highlights: ["Pace is steady.", "Method visibility matters more than speed here."],
            metrics: [
              { label: "Score", value: "77%" },
              { label: "Strong Topics", value: "Computation" },
              { label: "Focus", value: "Fractions" },
            ],
            summary: {
              strongTopics: [{ topicName: "Computation", accuracy: 88 }],
              weakTopics: [{ topicName: "Fractions", accuracy: 58 }],
              focusAreas: ["Equivalent fractions", "Method explanation"],
            },
            canTrigger: true,
            triggerLabel: "Regenerate report",
            statusMessage: "Maths report is ready.",
          },
          {
            id: "report-meera-lsa",
            reportScope: "SUBJECT",
            subject: "LSA",
            title: "Learning Style Assessment",
            status: "READY",
            generatedAt: "2026-03-17T07:08:00Z",
            markdownContent: "# Learning Style Assessment\n\n## Learning Profile\nDominant style: **AUDITORY**.\n\n## What Works Best\n- Verbal walkthroughs\n- Repetition aloud\n- Partner explanation tasks\n\n## Teaching Move\nAdd quick verbal rehearsal before written independent work.",
            highlights: ["Auditory rehearsal supports retention.", "Peer explanation is an effective bridge into independent tasks."],
            metrics: [
              { label: "Dominant Style", value: "Auditory" },
              { label: "Secondary", value: "Visual" },
              { label: "Confidence", value: "Moderate" },
            ],
            summary: {
              dominantStyle: "AUDITORY",
              tally: { VISUAL: 31, AUDITORY: 40, KINESTHETIC: 29 },
            },
            canTrigger: true,
            triggerLabel: "Regenerate report",
            statusMessage: "Learning profile report is ready.",
          },
        ],
        cumulativeReport: {
          id: "report-meera-cumulative",
          reportScope: "CUMULATIVE",
          subject: null,
          title: "Comprehensive Baseline Report",
          status: "FAILED",
          generatedAt: null,
          markdownContent: "",
          highlights: ["The cumulative report job failed after the subject reports finished."],
          metrics: [{ label: "Last Attempt", value: "Vertex timeout" }],
          summary: {},
          canTrigger: true,
          triggerLabel: "Retry cumulative",
          statusMessage: "Retry is recommended because the previous generation failed.",
        },
      },
    ],
  },
];

export const teacherReportStudents = teacherReportStudentsSeed;

export const studentReportPreview: ReportStudentPreview = {
  ...teacherReportStudentsSeed[1],
  id: "student-me-preview",
  name: "Your Report Center Preview",
  username: "student.preview",
  className: "Class 6",
  divisionName: "B",
};
