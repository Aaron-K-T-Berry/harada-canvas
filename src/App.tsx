import { useCallback, useMemo, useState } from "react";
import { HashRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { EditorPage } from "@/features/editor/editor-page";
import { createLocalStorageRepository } from "@/lib/storage/local-storage-repository";
import type { SquareRepository } from "@/lib/storage/repository";
import { RepositoryProvider } from "@/lib/storage/repository-context";
import type { ThemePreference } from "@/models/app-data";
import { createEmptyAppData } from "@/models/app-data";
import { createStandardSquare } from "@/models/harada-square";

interface AppProps {
  repository?: SquareRepository;
}

function AppRoutes({
  onboardingSeen,
  onCreateSquare,
  onMarkOnboardingSeen,
}: {
  onboardingSeen: boolean;
  onCreateSquare: () => string;
  onMarkOnboardingSeen: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <DashboardPage
              onboardingSeen={onboardingSeen}
              onMarkOnboardingSeen={onMarkOnboardingSeen}
              onCreateSquare={() => {
                const id = onCreateSquare();
                navigate(`/square/${id}`);
              }}
            />
          }
        />
        <Route path="square/:squareId" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App({ repository = createLocalStorageRepository() }: AppProps) {
  const initialRead = useMemo(() => repository.read(), [repository]);
  const [preferences, setPreferences] = useState(() =>
    initialRead.status === "ok" || initialRead.status === "empty"
      ? initialRead.data.preferences
      : createEmptyAppData().preferences,
  );

  const persistPreferences = useCallback(
    (next: typeof preferences) => {
      setPreferences(next);
      try {
        repository.setPreferences(next);
      } catch {
        // Invalid or missing storage will be surfaced by recovery flows later.
      }
    },
    [repository],
  );

  const handleThemeChange = useCallback(
    (theme: ThemePreference) => {
      persistPreferences({ ...preferences, theme });
    },
    [persistPreferences, preferences],
  );

  const handleMarkOnboardingSeen = useCallback(() => {
    if (preferences.onboardingSeen) {
      return;
    }
    persistPreferences({ ...preferences, onboardingSeen: true });
  }, [persistPreferences, preferences]);

  const handleCreateSquare = useCallback(() => {
    const square = createStandardSquare();
    repository.saveSquare(square);
    if (!preferences.onboardingSeen) {
      persistPreferences({ ...preferences, onboardingSeen: true });
    }
    return square.id;
  }, [persistPreferences, preferences, repository]);

  return (
    <ErrorBoundary>
      <RepositoryProvider repository={repository}>
        <ThemeProvider initialTheme={preferences.theme} onThemeChange={handleThemeChange}>
          <HashRouter>
            <AppRoutes
              onboardingSeen={preferences.onboardingSeen}
              onCreateSquare={handleCreateSquare}
              onMarkOnboardingSeen={handleMarkOnboardingSeen}
            />
          </HashRouter>
        </ThemeProvider>
      </RepositoryProvider>
    </ErrorBoundary>
  );
}
