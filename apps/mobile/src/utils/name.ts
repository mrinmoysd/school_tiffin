type NamePartsInput = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
};

const normalizeNamePart = (value?: string | null): string => (value ?? '').trim();

export const buildFullName = (
  firstName?: string | null,
  lastName?: string | null,
): string | null => {
  const parts = [normalizeNamePart(firstName), normalizeNamePart(lastName)].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
};

export const splitFullName = (
  fullName?: string | null,
): { firstName: string; lastName: string } => {
  const normalized = normalizeNamePart(fullName).replace(/\s+/g, ' ');
  if (!normalized) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...lastNameParts] = normalized.split(' ');
  return {
    firstName,
    lastName: lastNameParts.join(' '),
  };
};

export const resolveNameParts = ({
  firstName,
  lastName,
  fullName,
}: NamePartsInput): { firstName: string; lastName: string; fullName: string | null } => {
  const normalizedFirstName = normalizeNamePart(firstName);
  const normalizedLastName = normalizeNamePart(lastName);

  if (normalizedFirstName || normalizedLastName) {
    return {
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      fullName: buildFullName(normalizedFirstName, normalizedLastName),
    };
  }

  const fromFullName = splitFullName(fullName);
  return {
    ...fromFullName,
    fullName: buildFullName(fromFullName.firstName, fromFullName.lastName),
  };
};
