import { normalizeRelationshipKey } from './relationship-gender.util';

export type RelationshipBlockMap = Record<string, string[]>;

export const DEFAULT_RELATIONSHIP_BLOCKS_BY_HEAD_MARITAL_STATUS: RelationshipBlockMap = {
  single: [
    'spouse',
    'son',
    'daughter',
    'grandson',
    'granddaughter',
    'father_in_law',
    'mother_in_law',
    'brother_in_law',
    'sister_in_law',
    'son_in_law',
    'daughter_in_law',
  ],
  married: [],
  divorced: ['spouse', 'father_in_law', 'mother_in_law', 'brother_in_law', 'sister_in_law'],
  widowed: ['spouse', 'father_in_law', 'mother_in_law', 'brother_in_law', 'sister_in_law'],
  separated: ['spouse', 'father_in_law', 'mother_in_law', 'brother_in_law', 'sister_in_law'],
};

export function defaultRelationshipBlockMap(): RelationshipBlockMap {
  return cloneRelationshipBlockMap(DEFAULT_RELATIONSHIP_BLOCKS_BY_HEAD_MARITAL_STATUS);
}

export function normalizeRelationshipBlockMap(raw: unknown): RelationshipBlockMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaultRelationshipBlockMap();
  }

  const normalized = Object.entries(raw as Record<string, unknown>).reduce<RelationshipBlockMap>((map, [status, relationships]) => {
    const normalizedStatus = normalizeRelationshipKey(status);
    if (!normalizedStatus || !Array.isArray(relationships)) {
      return map;
    }

    map[normalizedStatus] = relationships
      .map(relationship => normalizeRelationshipKey(relationship))
      .filter((relationship): relationship is string => relationship.length > 0);

    return map;
  }, {});

  if (!Object.keys(normalized).length) {
    return defaultRelationshipBlockMap();
  }

  return {
    ...defaultRelationshipBlockMap(),
    ...normalized,
  };
}

export function blockedRelationshipsForHeadMaritalStatus(
  blockMap: RelationshipBlockMap,
  headMaritalStatus: unknown,
): string[] {
  return blockMap[normalizeRelationshipKey(headMaritalStatus)] ?? [];
}

export function isRelationshipBlockedForHeadMaritalStatus(
  blockMap: RelationshipBlockMap,
  headMaritalStatus: unknown,
  relationship: unknown,
): boolean {
  const normalizedRelationship = normalizeRelationshipKey(relationship);
  return normalizedRelationship.length > 0
    && blockedRelationshipsForHeadMaritalStatus(blockMap, headMaritalStatus).includes(normalizedRelationship);
}

function cloneRelationshipBlockMap(blockMap: RelationshipBlockMap): RelationshipBlockMap {
  return Object.entries(blockMap).reduce<RelationshipBlockMap>((copy, [status, relationships]) => {
    copy[status] = [...relationships];
    return copy;
  }, {});
}
