export interface AppNotification {
  id: number | string;
  title?: string;
  message: string;
  type?: string;
  is_read: boolean;
  read_at?: string;
  created_at?: string;
  updated_at?: string;
}
