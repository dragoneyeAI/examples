import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { TabBar } from "./components/TabBar";
import { Home } from "./screens/Home/Home";
import { DexGrid } from "./screens/DexGrid/DexGrid";
import { PlantDetail } from "./screens/PlantDetail/PlantDetail";
import { Search } from "./screens/Search/Search";
import { Collection } from "./screens/Collection/Collection";
import { Scan } from "./screens/Scan/Scan";

export function App() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <main className="app-scroll">
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
  );
}
