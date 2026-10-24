import { create } from 'zustand';
import { WebSocketEvent, SessionSnapshot } from './types';

interface LiveClinicState {
  isConnected: boolean;
  isOfflineMode: boolean;
  lastEvent: WebSocketEvent | null;
  eventsLog: WebSocketEvent[];
  activeTtsAnnouncement: string | null;
  setConnected: (connected: boolean) => void;
  setOfflineMode: (offline: boolean) => void;
  receiveEvent: (event: WebSocketEvent) => void;
  clearActiveTts: () => void;
}

export const useLiveClinicStore = create<LiveClinicState>((set) => ({
  isConnected: false,
  isOfflineMode: false,
  lastEvent: null,
  eventsLog: [],
  activeTtsAnnouncement: null,
  setConnected: (connected) => set({ isConnected: connected }),
  setOfflineMode: (offline) => set({ isOfflineMode: offline }),
  receiveEvent: (event) =>
    set((state) => ({
      lastEvent: event,
      eventsLog: [event, ...state.eventsLog].slice(0, 50),
      activeTtsAnnouncement:
        event.event_type === 'TOKEN_CALLED' && event.payload?.tts_announcements
          ? event.payload.tts_announcements['en-IN']
          : state.activeTtsAnnouncement,
    })),
  clearActiveTts: () => set({ activeTtsAnnouncement: null }),
}));

export class ReconnectingWebSocketClient {
  private socket: WebSocket | null = null;
  private clinicId: string;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private reconnectTimeoutId: any = null;
  private isDestroyed = false;

  constructor(clinicId: string) {
    this.clinicId = clinicId;
  }

  public connect() {
    if (typeof window === 'undefined') return;
    this.isDestroyed = false;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Backend runs on port 8080 by default
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//localhost:8080/ws/clinic/${this.clinicId}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`[WebSocket] Connected to clinic stream: ${this.clinicId}`);
        this.reconnectAttempts = 0;
        useLiveClinicStore.getState().setConnected(true);
        useLiveClinicStore.getState().setOfflineMode(false);
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WebSocketEvent;
          useLiveClinicStore.getState().receiveEvent(parsed);
        } catch (err) {
          console.warn('[WebSocket] Malformed message received:', err);
        }
      };

      this.socket.onclose = () => {
        useLiveClinicStore.getState().setConnected(false);
        if (!this.isDestroyed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        useLiveClinicStore.getState().setConnected(false);
        useLiveClinicStore.getState().setOfflineMode(true);
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    clearTimeout(this.reconnectTimeoutId);
    this.reconnectTimeoutId = setTimeout(() => {
      if (!this.isDestroyed) {
        this.connect();
      }
    }, delay);
  }

  public send(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn('[WebSocket] Socket not ready. Event queued/skipped.');
    }
  }

  public disconnect() {
    this.isDestroyed = true;
    clearTimeout(this.reconnectTimeoutId);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    useLiveClinicStore.getState().setConnected(false);
  }
}
