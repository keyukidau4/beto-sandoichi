export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'staff' | 'buyer';
  status: 'pending' | 'approved' | 'blacklisted';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfile {
  _id: string;
  userId: string;
  name: string;
  tel: string;
  zip1: string;
  zip2: string;
  address1: string;
  address2: string;
  point: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  buyerProfile: BuyerProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface EmailTemplate {
  _id: string;
  title: string;
  content: string;
  type: 'approval' | 'general' | 'promotion' | 'order_confirmation' | 'status_update' | 'point_notification';
  placeholders: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateRequest {
  title: string;
  content: string;
  type: 'approval' | 'general' | 'promotion' | 'order_confirmation' | 'status_update' | 'point_notification';
}

export interface UpdateEmailTemplateRequest extends CreateEmailTemplateRequest {
  _id: string;
}

export interface SendEmailRequest {
  userIds: string[];
  templateId: string;
}

export interface EmailHistoryResponse {
  history: EmailHistoryItem[]
}

export interface EmailHistoryItem {
  _id: string;
  templateId: string;
  templateTitle: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  status: 'sending' | 'completed' | 'failed';
  sentAt: string;
  recipients: EmailRecipient[];
}

export interface EmailRecipient {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  sentAt?: string;
}

export interface BulkSendProgress {
  total: number;
  sent: number;
  failed: number;
  current: string;
  isComplete: boolean;
}

export interface BulkEmailRequest {
  templateId: string;
  recipientIds: string[];
}

export interface PreviewTemplateRequest {
  templateId: string;
  sampleData?: Record<string, any>;
}

export interface ContactRequest {
  _id: string;
  buyerId: string;
  type: 'update-info' | 'general-inquiry' | 'complaint';
  content: string;
  adminResponse?: string;
  status: 'pending' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  type: 'update-info' | 'general-inquiry' | 'complaint';
  content: string;
}