import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import LoadingSpinner from "./components/ui/LoadingSpinner";

const Overview = lazy(() => import("./pages/Overview"));
const EventExplorer = lazy(() => import("./pages/EventExplorer"));
const AssetComparison = lazy(() => import("./pages/AssetComparison"));
const RegimeAnalysis = lazy(() => import("./pages/RegimeAnalysis"));
const DataManager = lazy(() => import("./pages/DataManager"));
const Methodology = lazy(() => import("./pages/Methodology"));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading workspace..." fullScreen />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/events" element={<EventExplorer />} />
          <Route path="/comparison" element={<AssetComparison />} />
          <Route path="/regimes" element={<RegimeAnalysis />} />
          <Route path="/data" element={<DataManager />} />
          <Route path="/methodology" element={<Methodology />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
