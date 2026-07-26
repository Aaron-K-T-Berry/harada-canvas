import { useCallback, useMemo, useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { EditorPage } from "@/features/editor/editor-page";
import { createLocalStorageRepository } from "@/lib/storage/local-storage-repository";
import type { SquareRepository } from "@/lib/storage/repository";
import type { ThemePreference } from "@/models/app-data";
import { createEmptyAppData } from "@/models/app-data";

interface AppProps {
  repository?: SquareRepository;
}

export default function App({ repository = createLocalStorageRepository() }: AppProps) {
  const initialRead = useMemo(() => repository.read(), [repository]);
  const [preferences, setPreferences] = useState(() =>
    initialRead.status === "ok" || initialRead.status === "empty"
      ? initialRead.data.preferences
      : createEmptyAppData().preferences,
  );

  const handleThemeChange = useCallback(
    (theme: ThemePreference) => {
      const next = { ...preferences, theme };
      setPreferences(next);
      try {
        repository.setPreferences(next);
      } catch {
        // Invalid or missing storage will be surfaced by recovery flows later.
      }
    },
    [preferences, repository],
  );

  return (
    <ErrorBoundary>
      <ThemeProvider initialTheme={preferences.theme} onThemeChange={handleThemeChange}>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route
                index
                element={<DashboardPage onboardingSeen={preferences.onboardingSeen} />}
              />
              <Route path="square/:squareId" element={<EditorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
