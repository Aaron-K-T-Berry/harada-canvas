import { useMemo, useState } from "react";
import { HashRouter, Navigate, Route, Routes, useNavigate } from "react-router";
import { AppShell } from "@/components/app-shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { EditorPage } from "@/features/editor/editor-page";
import { StorageRecovery } from "@/features/import-export/storage-recovery";
import { createLocalStorageRepository } from "@/lib/storage/local-storage-repository";
import type { SquareRepository } from "@/lib/storage/repository";
import { RepositoryProvider } from "@/lib/storage/repository-context";
import type { AppPreferences, ThemePreference } from "@/models/app-data";
import { createEmptyAppData } from "@/models/app-data";
import { createStandardSquare } from "@/models/harada-square";

interface AppProps {
  repository?: SquareRepository;
}

function AppRoutes({
  onboardingSeen,
  onCreateSquare,
  onMarkOnboardingSeen,
  onPreferencesChanged,
}: {
  onboardingSeen: boolean;
  onCreateSquare: () => string;
  onMarkOnboardingSeen: () => void;
  onPreferencesChanged: (preferences: AppPreferences) => void;
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
              onPreferencesChanged={onPreferencesChanged}
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
  const [storageIssue, setStorageIssue] = useState<{ reason: string; raw: string | null } | null>(
    () =>
      initialRead.status === "invalid"
        ? { reason: initialRead.reason, raw: initialRead.raw }
        : null,
  );
  const [preferences, setPreferences] = useState(() =>
    initialRead.status === "ok" || initialRead.status === "empty"
      ? initialRead.data.preferences
      : createEmptyAppData().preferences,
  );

  const persistPreferences = (next: AppPreferences) => {
    setPreferences(next);
    try {
      repository.setPreferences(next);
    } catch {
      // Invalid storage is handled by the recovery screen.
    }
  };

  const handleThemeChange = (theme: ThemePreference) => {
    persistPreferences({ ...preferences, theme });
  };

  const handleMarkOnboardingSeen = () => {
    if (preferences.onboardingSeen) {
      return;
    }
    persistPreferences({ ...preferences, onboardingSeen: true });
  };

  const handlePreferencesChanged = (next: AppPreferences) => {
    setPreferences(next);
  };

  const handleCreateSquare = () => {
    const square = createStandardSquare();
    repository.saveSquare(square);
    if (!preferences.onboardingSeen) {
      persistPreferences({ ...preferences, onboardingSeen: true });
    }
    return square.id;
  };

  const handleRecovered = (next: AppPreferences) => {
    setPreferences(next);
    setStorageIssue(null);
  };

  return (
    <ErrorBoundary>
      <RepositoryProvider repository={repository}>
        {storageIssue ? (
          <StorageRecovery
            repository={repository}
            reason={storageIssue.reason}
            raw={storageIssue.raw}
            onRecovered={handleRecovered}
          />
        ) : (
          <ThemeProvider initialTheme={preferences.theme} onThemeChange={handleThemeChange}>
            <HashRouter>
              <AppRoutes
                onboardingSeen={preferences.onboardingSeen}
                onCreateSquare={handleCreateSquare}
                onMarkOnboardingSeen={handleMarkOnboardingSeen}
                onPreferencesChanged={handlePreferencesChanged}
              />
            </HashRouter>
          </ThemeProvider>
        )}
      </RepositoryProvider>
    </ErrorBoundary>
  );
}
