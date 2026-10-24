import Dexie, { type Table } from 'dexie';

export interface OfflineMutation {
  id?: number;
  client_seq_id: number;
  timestamp: string;
  action_type: 'CHECK_IN' | 'CALL_NEXT' | 'ANESTHESIA_HOLD' | 'COMPLETE' | 'ODONTOGRAM_UPDATE' | 'FEE_PAYMENT';
  endpoint: string;
  payload: any;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retry_count: number;
}

export interface CachedPatientRoster {
  patient_id: string;
  full_name: string;
  phone: string;
  priority_flags: string[];
  medical_alerts: string[];
  last_updated: string;
}

class SmartOpdDatabase extends Dexie {
  mutations!: Table<OfflineMutation>;
  roster!: Table<CachedPatientRoster>;

  constructor() {
    super('SmartOpdOfflineStore');
    this.version(1).stores({
      mutations: '++id, client_seq_id, status, timestamp',
      roster: 'patient_id, phone, full_name',
    });
  }
}

export const offlineDb = new SmartOpdDatabase();

let currentLamportClock = Date.now();

export function getNextLamportClock(): number {
  currentLamportClock += 1;
  return currentLamportClock;
}

export async function queueOfflineMutation(
  action_type: OfflineMutation['action_type'],
  endpoint: string,
  payload: any
): Promise<number> {
  const mutation: OfflineMutation = {
    client_seq_id: getNextLamportClock(),
    timestamp: new Date().toISOString(),
    action_type,
    endpoint,
    payload,
    status: 'PENDING',
    retry_count: 0,
  };

  const id = await offlineDb.mutations.add(mutation);
  console.log(`[Offline Outbox] Queued mutation #${id} [${action_type}]`);
  return id as number;
}

export async function syncOfflineOutbox(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const pending = await offlineDb.mutations
    .where('status')
    .equals('PENDING')
    .sortBy('client_seq_id');

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const response = await fetch(item.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });

      if (response.ok) {
        await offlineDb.mutations.update(item.id!, { status: 'SYNCED' });
        synced++;
      } else {
        await offlineDb.mutations.update(item.id!, {
          retry_count: item.retry_count + 1,
          status: item.retry_count > 5 ? 'FAILED' : 'PENDING',
        });
        failed++;
      }
    } catch {
      await offlineDb.mutations.update(item.id!, {
        retry_count: item.retry_count + 1,
      });
      failed++;
    }
  }

  return { synced, failed };
}
