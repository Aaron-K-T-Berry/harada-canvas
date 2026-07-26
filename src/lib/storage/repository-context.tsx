import { createContext, type ReactNode, useContext } from "react";
import type { SquareRepository } from "@/lib/storage/repository";

const RepositoryContext = createContext<SquareRepository | null>(null);

interface RepositoryProviderProps {
  repository: SquareRepository;
  children: ReactNode;
}

export function RepositoryProvider({ repository, children }: RepositoryProviderProps) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): SquareRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) {
    throw new Error("useRepository must be used within a RepositoryProvider.");
  }
  return repository;
}
