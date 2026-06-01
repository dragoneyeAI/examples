import { useEffect, useLayoutEffect, useRef } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { TabBar } from "./components/TabBar";
import { DexHeader } from "./components/DexHeader";
import {
  DexHeaderProvider,
  useDexDeck,
} from "./components/DexHeaderContext";
import { Home } from "./screens/Home/Home";
import { DexGrid } from "./screens/DexGrid/DexGrid";
import { PlantDetail } from "./screens/PlantDetail/PlantDetail";
import { Search } from "./screens/Search/Search";
import { Collection } from "./screens/Collection/Collection";
import { Scan } from "./screens/Scan/Scan";

/** The fixed top deck — permanent device chrome (mirrors the fixed TabBar).
 *  Reads whatever the current screen published via useDexHeader. */
function DexDeck() {
  const c = useDexDeck();
  return <DexHeader title={c.title} subtitle={c.subtitle} right={c.right} />;
}

export function App() {
  const location = useLocation();
  const navType = useNavigationType(); // "PUSH" | "POP" | "REPLACE"
  const scrollRef = useRef<HTMLElement>(null);
  const positions = useRef(new Map<string, number>());

  // Continuously remember where the CURRENT history entry is scrolled to, so
  // we can restore it when the user navigates back.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => positions.current.set(location.key, el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [location.key]);

  // On navigation, back (POP) restores the saved offset; everything else starts
  // at the top, like a native app. The scroll container is .app-scroll (NOT
  // window). useLayoutEffect runs before paint so the previous scroll position
  // never flashes through the cross-fade.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop =
      navType === "POP" ? positions.current.get(location.key) ?? 0 : 0;
  }, [location.key, navType]);

  return (
    <DexHeaderProvider>
      <div className="app-shell">
        {/* Fixed top deck: permanent chrome above the scrolling LCD screen. */}
        <DexDeck />
        <main className="app-scroll" ref={scrollRef}>
          {/* Screens cross-fade by stacking in the same CSS grid cell (see
              .app-scroll in theme.css). We intentionally do NOT use mode="wait":
              it withholds mounting the next screen until the previous one's exit
              completes, and the Dex/Search grids' `layout` motion children don't
              reliably emit exit-complete — which left the next screen unmounted
              (blank page) on every card tap. */}
          <AnimatePresence initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/dex" element={<DexGrid />} />
              <Route path="/plant/:id" element={<PlantDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/scan" element={<Scan />} />
            </Routes>
          </AnimatePresence>
        </main>
        <TabBar />
      </div>
    </DexHeaderProvider>
  );
}
