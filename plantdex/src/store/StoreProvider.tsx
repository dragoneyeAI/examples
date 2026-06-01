import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PlantdexStore } from "./PlantdexStore";
import { LocalStorageStore } from "./LocalStorageStore";
import type {
  DiscoveryRecord,
  DiscoverySource,
  AppMeta,
} from "../types/discovery";
import { EMPTY_META } from "../types/discovery";

/** Local YYYY-MM-DD (not UTC) so the daily streak matches the user's calendar. */
function todayKey(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export interface DiscoverResult {
  record: DiscoveryRecord;
  isNew: boolean;
}

interface StoreContextValue {
  ready: boolean;
  discoveries: Map<string, DiscoveryRecord>;
  discoveredCount: number;
  meta: AppMeta;
  isDiscovered: (plantId: string) => boolean;
  discover: (
    plantId: string,
    source?: DiscoverySource,
    extra?: Partial<DiscoveryRecord>,
  ) => Promise<DiscoverResult>;
  undiscover: (plantId: string) => Promise<void>;
  setLastViewed: (plantId: string) => void;
  clearAll: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  children,
  store,
}: {
  children: ReactNode;
  /** Injectable for tests; defaults to the localStorage impl. */
  store?: PlantdexStore;
}) {
  const storeRef = useRef<PlantdexStore>(store ?? new LocalStorageStore());
  const [ready, setReady] = useState(false);
  const [discoveries, setDiscoveries] = useState<Map<string, DiscoveryRecord>>(
    new Map(),
  );
  const [meta, setMeta] = useState<AppMeta>(EMPTY_META);

  // Initial load + daily streak roll-over.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = storeRef.current;
      const [recs, savedMeta] = await Promise.all([
        s.getDiscoveries(),
        s.getMeta(),
      ]);
      if (cancelled) return;

      const today = todayKey();
      let nextMeta: AppMeta = { ...savedMeta };
      if (savedMeta.lastOpenedDate !== today) {
        const gap = savedMeta.lastOpenedDate
          ? dayDiff(savedMeta.lastOpenedDate, today)
          : Infinity;
        nextMeta.streakCount = gap === 1 ? (savedMeta.streakCount || 0) + 1 : 1;
        nextMeta.lastOpenedDate = today;
        await s.setMeta(nextMeta);
      }

      setDiscoveries(new Map(recs.map((r) => [r.plantId, r])));
      setMeta(nextMeta);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const isDiscovered = (plantId: string) => discoveries.has(plantId);

    const discover: StoreContextValue["discover"] = async (
      plantId,
      source = "manual",
      extra,
    ) => {
      const existing = discoveries.get(plantId);
      if (existing) return { record: existing, isNew: false };
      const record: DiscoveryRecord = {
        plantId,
        dateSeen: new Date().toISOString(),
        source,
        ...extra,
      };
      await storeRef.current.discover(record);
      setDiscoveries((prev) => new Map(prev).set(plantId, record));
      return { record, isNew: true };
    };

    const undiscover: StoreContextValue["undiscover"] = async (plantId) => {
      await storeRef.current.undiscover(plantId);
      setDiscoveries((prev) => {
        const next = new Map(prev);
        next.delete(plantId);
        return next;
      });
    };

    const setLastViewed = (plantId: string) => {
      if (meta.lastViewedPlantId === plantId) return;
      const next = { ...meta, lastViewedPlantId: plantId };
      setMeta(next);
      void storeRef.current.setMeta({ lastViewedPlantId: plantId });
    };

    const clearAll = async () => {
      await storeRef.current.clear();
      setDiscoveries(new Map());
      setMeta((m) => ({ ...EMPTY_META, lastOpenedDate: m.lastOpenedDate, streakCount: m.streakCount }));
    };

    return {
      ready,
      discoveries,
      discoveredCount: discoveries.size,
      meta,
      isDiscovered,
      discover,
      undiscover,
      setLastViewed,
      clearAll,
    };
  }, [ready, discoveries, meta]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
