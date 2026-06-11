import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import type { Characteristic } from "@/entities/characteristic";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";

export type CharacteristicsStoreState = {
  characteristics: Characteristic[];
};

type CharacteristicsStoreActions = {
  createCharacteristic: (input: {
    key: string;
    description: string;
    example?: string | null;
  }) => string;
  /** Keys only: description `''`, example `null`. Skips keys that already exist. */
  createCharacteristics: (keys: string[]) => void;
  updateCharacteristic: (id: string, patch: Partial<Characteristic>) => void;
  deleteCharacteristic: (id: string) => void;
  getCharacteristicById: (id: string) => Characteristic | undefined;
};

export type CharacteristicsStore = CharacteristicsStoreState &
  CharacteristicsStoreActions;

export type CharacteristicsStoreApi = ReturnType<
  typeof createCharacteristicsStore
>;

export function createCharacteristicsStore() {
  return createStore<CharacteristicsStore>()(
    persist(
      (set, get) => ({
        characteristics: [],

        createCharacteristic: (input) => {
          const id = generateId();
          const now = nowISO();
          const item: Characteristic = {
            id,
            key: input.key,
            description: input.description,
            example: input.example ?? null,
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({ characteristics: [...s.characteristics, item] }));
          return id;
        },

        createCharacteristics: (keys) => {
          const existing = new Set(get().characteristics.map((c) => c.key));
          const now = nowISO();
          const toAdd: Characteristic[] = [];
          for (const raw of keys) {
            const k = raw.trim();
            if (!k || existing.has(k)) continue;
            existing.add(k);
            toAdd.push({
              id: generateId(),
              key: k,
              description: "",
              example: null,
              createdAt: now,
              updatedAt: now,
            });
          }
          if (toAdd.length === 0) return;
          set((s) => ({
            characteristics: [...s.characteristics, ...toAdd],
          }));
        },

        updateCharacteristic: (id, patch) => {
          set((s) => ({
            characteristics: s.characteristics.map((c) =>
              c.id === id
                ? {
                    ...c,
                    ...patch,
                    id: c.id,
                    createdAt: c.createdAt,
                    updatedAt: nowISO(),
                  }
                : c,
            ),
          }));
        },

        deleteCharacteristic: (id) => {
          set((s) => ({
            characteristics: s.characteristics.filter((c) => c.id !== id),
          }));
        },

        getCharacteristicById: (id) =>
          get().characteristics.find((c) => c.id === id),
      }),
      { name: "pls-characteristics-store" },
    ),
  );
}
