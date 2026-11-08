import type { RubricCriterion } from "@/db/types"

/**
 * Default 100-point assessment rubric (from the GSU "Assessment Criteria"
 * document). Used as the starting rubric for new assignments; instructors can
 * edit it, clear it, or add their own criteria.
 */
export const DEFAULT_ASSIGNMENT_RUBRIC: RubricCriterion[] = [
  // Essay evaluation — 50
  {
    id: "content-topic",
    label: "Content — Topic agreement with the assignment's directions, title and purpose",
    points: 10,
  },
  { id: "content-development", label: "Content — Satisfying development of each section", points: 10 },
  { id: "content-validation", label: "Content — Use of references and in-text citations", points: 10 },
  {
    id: "content-argumentation",
    label: "Content — Views properly developed and supported with in-text citations",
    points: 5,
  },
  {
    id: "content-personal-style",
    label: "Content — Personal view expressed with critical perspective",
    points: 5,
  },
  {
    id: "content-references",
    label: "Content — References (convergent and divergent production)",
    points: 10,
  },
  // Structure — 30
  {
    id: "structure-parts",
    label: "Structure — Introduction, main text and conclusions",
    points: 10,
  },
  { id: "structure-logical", label: "Structure — Logical structure", points: 10 },
  {
    id: "structure-macro",
    label: "Structure — Links and sequence of chapters and sub-sections",
    points: 5,
  },
  { id: "structure-micro", label: "Structure — Links and sequence of paragraphs", points: 5 },
  // Language clarity and accuracy — 10
  {
    id: "language-terms",
    label: "Language — Consistent use of terms and scientific names",
    points: 3,
  },
  { id: "language-flow", label: "Language — Clarity, accuracy and language flow", points: 2 },
  { id: "language-syntax", label: "Language — Elaborate syntax", points: 3 },
  { id: "language-spelling", label: "Language — Correct spelling", points: 2 },
  // Presentation — 10
  {
    id: "presentation-general",
    label:
      "Presentation — Cover page, table of contents, page numbering, margins, spacing and font consistency",
    points: 5,
  },
  { id: "presentation-apa", label: "Presentation — APA citations and reference list", points: 5 },
]

export function defaultRubric(): RubricCriterion[] {
  return DEFAULT_ASSIGNMENT_RUBRIC.map((criterion) => ({ ...criterion }))
}
