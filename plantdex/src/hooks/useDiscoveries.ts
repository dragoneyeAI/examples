import { useStore } from "../store/StoreProvider";
import { PLANT_COUNT, PLANTS } from "../data/plants";

/** Convenience view over the store for collection/progress UI. */
export function useDiscoveries() {
  const store = useStore();
  const { discoveries, discoveredCount } = store;

  const recent = [...discoveries.values()]
    .sort(
      (a, b) =>
        new Date(b.dateSeen).getTime() - new Date(a.dateSeen).getTime(),
    )
    .map((d) => PLANTS.find((p) => p.id === d.plantId))
    .filter((p): p is (typeof PLANTS)[number] => Boolean(p));

  return {
    ...store,
    total: PLANT_COUNT,
    discoveredCount,
    completion: PLANT_COUNT ? discoveredCount / PLANT_COUNT : 0,
    recent,
  };
}
