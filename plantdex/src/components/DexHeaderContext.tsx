import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** What the fixed top deck (DexHeader) shows for the current screen. */
export type DeckConfig = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

const DEFAULT: DeckConfig = { title: "Plantdex" };

const Ctx = createContext<{
  config: DeckConfig;
  setConfig: (c: DeckConfig) => void;
}>({ config: DEFAULT, setConfig: () => {} });

/** Holds the current deck config. The DexHeader is rendered once as fixed
 *  chrome in the app shell (see App.tsx) and reads from here; each screen
 *  publishes its own title/subtitle/right via {@link useDexHeader}. Defaults to
 *  "Plantdex" so the deck is never empty (no one-frame gap on first paint). */
export function DexHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DeckConfig>(DEFAULT);
  return <Ctx.Provider value={{ config, setConfig }}>{children}</Ctx.Provider>;
}

export function useDexDeck(): DeckConfig {
  return useContext(Ctx).config;
}

/** Screens call this to publish the fixed deck's text. There is intentionally
 *  NO clear-on-unmount: during a route change two screens are briefly mounted
 *  (we don't use AnimatePresence mode="wait"), and the entering screen's effect
 *  runs last — so it always wins and there's no null/flicker in between.
 *
 *  `right` is JSX (a new identity each render); when it's dynamic, memoize it in
 *  the caller (see Home) so this effect doesn't re-publish — and re-render —
 *  every frame. */
export function useDexHeader({ title, subtitle, right }: DeckConfig) {
  const { setConfig } = useContext(Ctx);
  useEffect(() => {
    setConfig({ title, subtitle, right });
  }, [title, subtitle, right, setConfig]);
}
