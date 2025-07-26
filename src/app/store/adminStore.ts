// src/store/adminStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AdminStore = {
  username: string | null;
  setUsername: (username: string) => void;
  logout: () => void;
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      username: null,
      setUsername: (username) => set({ username }),
      logout: () => set({ username: null }),
    }),
    {
      name: "admin-storage",
    },
  ),
);
