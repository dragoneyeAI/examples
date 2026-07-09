import { useMemo } from "react";
import { PLANTS } from "../data/plants";
import type { Plant, PlantType, Habitat } from "../types/plant";

export interface SearchFilters {
  query: string;
  types: PlantType[];
  habitats: Habitat[];
  petSafeOnly: boolean;
}

export const EMPTY_FILTERS: SearchFilters = {
  query: "",
  types: [],
  habitats: [],
  petSafeOnly: false,
};

function matchesQuery(plant: Plant, q: string): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    plant.commonName.toLowerCase().includes(needle) ||
    plant.latinName.toLowerCase().includes(needle) ||
    (plant.family?.toLowerCase().includes(needle) ?? false) ||
    plant.taxonRef.aliases.some((a) => a.includes(needle))
  );
}

/** Filters the in-memory plant index. Pure + memoized — no async, no fetch. */
export function useSearch(filters: SearchFilters): Plant[] {
  return useMemo(() => {
    return PLANTS.filter((p) => {
      if (!matchesQuery(p, filters.query)) return false;
      if (filters.types.length && !filters.types.some((t) => p.types.includes(t)))
        return false;
      if (
        filters.habitats.length &&
        !filters.habitats.some((h) => p.habitat.includes(h))
      )
        return false;
      if (filters.petSafeOnly && p.care.petSafe !== true) return false;
      return true;
    });
  }, [filters]);
}
