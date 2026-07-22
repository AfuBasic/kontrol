/**
 * @deprecated Use SecurityStore / sha256 from @/Resilience instead.
 * Kept as a thin compatibility shim so legacy imports do not break.
 */

export type { CachedCode, OfflineLog } from '@/Resilience/OfflineStorage/types';
export { SecurityStore as offlineDb } from '@/Resilience/OfflineStorage/SecurityStore';
export { sha256 } from '@/Resilience/sha256';
