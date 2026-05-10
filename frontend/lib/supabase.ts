import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Subscribe to new messages in a conversation
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: any) => void
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => onMessage(payload.new))
    .subscribe();
}

// Subscribe to conversation list updates for a tenant
export function subscribeToConversations(
  tenantId: string,
  onUpdate: (conversation: any) => void
) {
  return supabase
    .channel(`conversations:${tenantId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations',
      filter: `tenant_id=eq.${tenantId}`,
    }, (payload) => onUpdate(payload.new))
    .subscribe();
}
