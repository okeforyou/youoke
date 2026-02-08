/**
 * Cast Command Utilities
 *
 * Helper functions for Remote to send commands to Monitor
 */

import { realtimeDb, auth } from '../firebase';
import { CastCommand, CastCommandEnvelope } from '../types/castCommands';

/**
 * Generate a unique command ID
 */
function generateCommandId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send a command to the Monitor
 * Remote uses this to control playback
 * Uses REST API to bypass Firebase SDK stack overflow bug
 */
export async function sendCommand(roomCode: string, command: CastCommand, from: 'remote' | 'monitor' = 'remote'): Promise<string> {
  if (!realtimeDb) {
    throw new Error('Firebase not initialized');
  }

  const commandId = generateCommandId();
  const dbURL = realtimeDb.app.options.databaseURL;

  const envelope: CastCommandEnvelope = {
    id: commandId,
    command,
    status: 'pending',
    timestamp: Date.now(),
    from,
  };

  // Use REST API instead of set() to bypass stack overflow
  try {
    const user = auth?.currentUser;
    const token = user ? await user.getIdToken() : null;

    const url = token
      ? `${dbURL}/rooms/${roomCode}/commands/${commandId}.json?auth=${token}`
      : `${dbURL}/rooms/${roomCode}/commands/${commandId}.json`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });

    if (!response.ok) {
      throw new Error(`Failed to send command: ${response.status}`);
    }

    console.log('📤 Command sent via REST API:', command.type, from);
    return commandId;
  } catch (error) {
    console.error('❌ Failed to send command:', error);
    throw error;
  }
}

/**
 * Clean up old completed/failed commands
 * Prevents Firebase from getting too large
 * Uses REST API to bypass Firebase SDK stack overflow bug
 */
export async function cleanupCommands(roomCode: string, olderThanMinutes: number = 5): Promise<void> {
  if (!realtimeDb) return;

  const dbURL = realtimeDb.app.options.databaseURL;

  try {
    // Fetch all commands using REST API
    const response = await fetch(`${dbURL}/rooms/${roomCode}/commands.json`);
    const commands = await response.json();

    if (!commands) return;

    const now = Date.now();
    const cutoff = now - olderThanMinutes * 60 * 1000;

    // Delete old completed/failed commands
    const user = auth?.currentUser;
    const token = user ? await user.getIdToken() : null;

    for (const [id, envelope] of Object.entries(commands) as [string, any][]) {
      if (
        (envelope.status === 'completed' || envelope.status === 'failed') &&
        envelope.timestamp < cutoff
      ) {
        const deleteURL = token
          ? `${dbURL}/rooms/${roomCode}/commands/${id}.json?auth=${token}`
          : `${dbURL}/rooms/${roomCode}/commands/${id}.json`;

        await fetch(deleteURL, { method: 'DELETE' });
        console.log('🗑️ Deleted old command:', id);
      }
    }
  } catch (error) {
    console.error('❌ Failed to cleanup commands:', error);
  }
}
