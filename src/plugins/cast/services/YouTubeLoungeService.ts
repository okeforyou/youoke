/**
 * YouTube Lounge Service (v5.0 R&D)
 * 
 * Handle pairing and remote control for Native YouTube TV App
 * Using Lounge / Screen Pairing protocol.
 */

import axios from 'axios';

export interface LoungePairingResponse {
  screenId: string;
  loungeToken: string;
}

export class YouTubeLoungeService {
  private static instance: YouTubeLoungeService;
  private loungeToken: string | null = null;
  private screenId: string | null = null;

  private sid: string | null = null;
  private gsid: string | null = null;
  private aid: number = 1; // Action ID (increments with each command)

  private constructor() {}

  public static getInstance(): YouTubeLoungeService {
    if (!YouTubeLoungeService.instance) {
      YouTubeLoungeService.instance = new YouTubeLoungeService();
    }
    return YouTubeLoungeService.instance;
  }

  /**
   * Phase 1: Convert 12-digit pairing code to screenId and Get Lounge Token
   */
  public async pairWithCode(pairingCode: string): Promise<boolean> {
    const cleanCode = pairingCode.replace(/\s/g, '');
    if (cleanCode.length !== 12) return false;

    console.log('🔗 [YouTubeLounge] Attempting pairing with code:', cleanCode);

    try {
      // Step A: Get screenId from pairing code 
      // API: https://www.youtube.com/api/lounge/pairing/get_screen?pairing_code=...
      const screenResponse = await axios.get(`https://www.youtube.com/api/lounge/pairing/get_screen?pairing_code=${cleanCode}`);
      
      if (!screenResponse.data || !screenResponse.data.screenId) {
          console.warn('⚠️ screenId not found for code:', cleanCode);
          return false;
      }

      this.screenId = screenResponse.data.screenId;
      console.log('✅ [YouTubeLounge] Found Screen ID:', this.screenId);

      // Step B: Get Lounge Token (Real binding logic would start here)
      // GET: https://www.youtube.com/api/lounge/pairing/get_lounge_token_batch?screen_ids=...
      const tokenResponse = await axios.get(`https://www.youtube.com/api/lounge/pairing/get_lounge_token_batch?screen_ids=${this.screenId}`);
      
      if (tokenResponse.data && tokenResponse.data.screens && tokenResponse.data.screens[0]) {
          this.loungeToken = tokenResponse.data.screens[0].loungeToken;
          console.log('✅ [YouTubeLounge] Lounge Token acquired!');
          
          // Step C: Initialize Session (GET bind to get SID/GSID)
          // For R&D Phase, we will mark as ready. 
          // Real communication uses: google.com/lounge/bc/bind
          return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [YouTubeLounge] Pairing failed:', error);
      return false;
    }
  }

  /**
   * Phase 2: Send Command to YouTube TV (Direct Push)
   * 
   * This handles the actual 'Add to Queue' or 'Set Playlist' on the TV
   */
  public async sendCommand(command: 'add' | 'remove' | 'play' | 'pause' | 'skip' | 'setQueue', videoId?: string, list?: string[]) {
    if (!this.loungeToken) {
      console.warn('⚠️ YouTube TV not connected (No Lounge Token)');
      return;
    }

    this.aid++;
    const RID = Math.floor(Math.random() * 100000);
    
    console.log(`📡 [YouTubeLounge] Sending [${command}] (RID: ${RID}) to TV...`);

    try {
      const params = new URLSearchParams();
      params.append('count', '1');
      params.append('req0_at', '0');

      if (command === 'add' && videoId) {
          params.append('req0_sc', 'addVideo');
          params.append('req0_v', videoId);
      } else if (command === 'setQueue' && list && list.length > 0) {
          params.append('req0_sc', 'setPlaylist');
          params.append('req0_v', list[0]); // Start with first
          params.append('req0_listId', '');
          params.append('req0_videoIds', list.join(','));
      } else if (command === 'play') {
          params.append('req0_sc', 'play');
      } else if (command === 'pause') {
          params.append('req0_sc', 'pause');
      } else if (command === 'skip') {
          params.append('req0_sc', 'next');
      }

      // API: https://www.youtube.com/api/lounge/bc/bind
      // Needs 'loungeIdToken' in query or body. Most implementations use query.
      const url = `https://www.youtube.com/api/lounge/bc/bind?device=remote&id=youoke-remote-${Date.now()}&name=YouOke&VER=8&v=2&RID=${RID}&loungeIdToken=${this.loungeToken}`;
      
      const response = await axios.post(url, params.toString(), {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
      });

      console.log('✅ [YouTubeLounge] Command sent!', response.status);
      return true;
    } catch (error) {
      console.error('❌ [YouTubeLounge] Command failed:', error);
      return false;
    }
  }

  public disconnect() {
      this.loungeToken = null;
      this.screenId = null;
      this.sid = null;
      this.gsid = null;
      console.log('🔌 [YouTubeLounge] Remote disconnected');
  }
}

export const youtubeLoungeService = YouTubeLoungeService.getInstance();
