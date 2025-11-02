/**
 * Cast Command Utilities
 *
 * Helper functions for Remote to send commands to Monitor
 */

import { ref, push, set } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { CastCommand, CastCommandEnvelope } from '../types/castCommands';

/**
 * Send a command to the Monitor
 * Remote uses this to control playback
 */
export async function sendCommand(roomCode: string, command: CastCommand, from: 'remote' | 'monitor' = 'remote'): Promise<string> {
  if (!realtimeDb) {
    throw new Error('Firebase not initialized');
  }

  const commandsRef = ref(realtimeDb, `rooms/${roomCode}/commands`);
  const newCommandRef = push(commandsRef);
  const commandId = newCommandRef.key!;

  const envelope: CastCommandEnvelope = {
    id: commandId,
    command,
    status: 'pending',
    timestamp: Date.now(),
    from,
  };

  await set(newCommandRef, envelope);
  console.log('📤 Command sent:', command.type, from);

  return commandId;
}

/**
 * Clean up old completed/failed commands
 * Prevents Firebase from getting too large
 */
export async function cleanupCommands(roomCode: string, olderThanMinutes: number = 5): Promise<void> {
  if (!realtimeDb) return;

  const commandsRef = ref(realtimeDb, `rooms/${roomCode}/commands`);
  const { onValue, remove } = await import('firebase/database');

  onValue(
    commandsRef,
    (snapshot) => {
      const commands = snapshot.val();
      if (!commands) return;

      const now = Date.now();
      const cutoff = now - olderThanMinutes * 60 * 1000;

      Object.entries(commands).forEach(([id, envelope]: [string, any]) => {
        if (
          (envelope.status === 'completed' || envelope.status === 'failed') &&
          envelope.timestamp < cutoff
        ) {
          const commandRef = ref(realtimeDb, `rooms/${roomCode}/commands/${id}`);
          remove(commandRef);
        }
      });
    },
    { onlyOnce: true }
  );
}
