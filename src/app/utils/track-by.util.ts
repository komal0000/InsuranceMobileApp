export function trackByEntity(index: number, item: unknown): unknown {
  if (!item || typeof item !== 'object') {
    return item ?? index;
  }

  const value = item as Record<string, unknown>;
  return value['id']
    ?? value['uuid']
    ?? value['member_id']
    ?? value['enrollment_id']
    ?? value['renewal_id']
    ?? value['payment_id']
    ?? value['notification_id']
    ?? value['chfid']
    ?? value['code']
    ?? value['value']
    ?? value['name']
    ?? value['label']
    ?? index;
}
