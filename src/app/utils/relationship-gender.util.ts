export type RelationshipGender = 'male' | 'female';
export type RelationshipGenderMap = Record<string, RelationshipGender>;

export function normalizeRelationshipKey(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/^_+|_+$/g, '');
}

export function normalizeRelationshipGenderMap(raw: unknown): RelationshipGenderMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  return Object.entries(raw as Record<string, unknown>).reduce<RelationshipGenderMap>((map, [key, value]) => {
    const normalizedKey = normalizeRelationshipKey(key);
    if (!normalizedKey || (value !== 'male' && value !== 'female')) {
      return map;
    }

    map[normalizedKey] = value;
    return map;
  }, {});
}

export function genderForRelationship(
  relationshipGenderMap: RelationshipGenderMap,
  relationship: unknown,
): RelationshipGender | null {
  return relationshipGenderMap[normalizeRelationshipKey(relationship)] || null;
}
