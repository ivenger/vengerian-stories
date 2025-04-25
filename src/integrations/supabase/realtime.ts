
import { supabase } from "./client";

// Setup realtime for reading_history table
export const setupRealtimeForReadingHistory = async () => {
  try {
    const channel = supabase.channel('reading_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_history',
        },
        (payload) => {
          console.log(`[${new Date().toISOString()}] Reading history realtime update:`, payload);
        }
      )
      .subscribe();

    console.log(`[${new Date().toISOString()}] Setup realtime subscription for reading_history table`);
    return channel;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error setting up realtime for reading_history:`, error);
    return null;
  }
};

// Connection status monitoring
export const setupConnectionMonitoring = () => {
  let isReconnecting = false;
  const connectionStatusChannel = supabase.channel('connection-status');

  connectionStatusChannel
    .on('system', { event: 'disconnect' }, () => {
      console.log('Lost connection to Supabase');
      if (!isReconnecting) {
        isReconnecting = true;
        setTimeout(async () => {
          try {
            await connectionStatusChannel.subscribe();
            console.log('Reconnected to Supabase');
          } catch (error) {
            console.error('Failed to reconnect:', error);
          } finally {
            isReconnecting = false;
          }
        }, 1000);
      }
    })
    .subscribe();

  return connectionStatusChannel;
};
