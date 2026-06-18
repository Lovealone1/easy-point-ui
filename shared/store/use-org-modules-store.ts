import { create } from 'zustand';

interface OrgModulesState {
  activeModuleKeys: Set<string> | null; // null means not loaded yet (fallback / loading state)
  setActiveModules: (keys: string[]) => void;
  isModuleActive: (key: string) => boolean;
  clearActiveModules: () => void;
}

export const useOrgModulesStore = create<OrgModulesState>()((set, get) => ({
  activeModuleKeys: null,

  setActiveModules: (keys) => {
    const mappedKeys = keys.map((key) => {
      const overrides: Record<string, string> = {
        organizations: 'organization',
        sale_utilities: 'utilities',
        organization_configs: 'organization-config',
      };
      if (key in overrides) return overrides[key];
      return key.replace(/_/g, '-');
    });
    set({ activeModuleKeys: new Set(mappedKeys) });
  },

  isModuleActive: (key) => {
    const { activeModuleKeys } = get();
    // If not loaded yet, default to active (safe fallback) or handle dynamically
    if (activeModuleKeys === null) return true;
    return activeModuleKeys.has(key);
  },

  clearActiveModules: () => {
    set({ activeModuleKeys: null });
  },
}));
