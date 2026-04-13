export const getStudentLimitReachedMessage = (
  currentStudents: number,
  maxStudents: number,
): string =>
  `Student limit reached. You already have ${currentStudents} student(s). Maximum allowed is ${maxStudents}. Please contact admin to increase your limit.`;

export const hasReachedStudentLimit = (
  currentStudents: number,
  maxStudents: number | null | undefined,
): boolean => typeof maxStudents === 'number' && currentStudents >= maxStudents;
