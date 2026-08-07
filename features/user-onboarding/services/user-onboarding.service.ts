// ─────────────────────────────────────────────────────────────────────────────
// features/user-onboarding/services/user-onboarding.service.ts
//
// Personal Space onboarding wizard and preferences.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type {
  OnboardingState,
  OnboardingGoal,
  OnboardingGoalOption,
  UserPreferences,
  UpdateReminderPreferencesDTO,
  UpdateUserPreferencesDTO,
} from "../types/user-onboarding.types"

class UserOnboardingServiceClass {
  /** Resume state — creates the preferences row with defaults on first call. */
  async getState(): Promise<OnboardingState> {
    const { data } = await apiClient.get<OnboardingState>("/me/onboarding")
    return data
  }

  async getGoals(): Promise<OnboardingGoalOption[]> {
    const { data } = await apiClient.get<OnboardingGoalOption[]>("/me/onboarding/goals")
    return data
  }

  async setGoal(goal: OnboardingGoal): Promise<OnboardingState> {
    const { data } = await apiClient.patch<OnboardingState>("/me/onboarding/goal", { goal })
    return data
  }

  async setRegion(timezone: string, preferredCurrency: string): Promise<OnboardingState> {
    const { data } = await apiClient.patch<OnboardingState>("/me/onboarding/region", {
      timezone,
      preferredCurrency,
    })
    return data
  }

  async setReminders(payload: UpdateReminderPreferencesDTO): Promise<OnboardingState> {
    const { data } = await apiClient.patch<OnboardingState>("/me/onboarding/reminders", payload)
    return data
  }

  async complete(): Promise<OnboardingState> {
    const { data } = await apiClient.post<OnboardingState>("/me/onboarding/complete")
    return data
  }

  async getPreferences(): Promise<UserPreferences> {
    const { data } = await apiClient.get<UserPreferences>("/me/preferences")
    return data
  }

  async updatePreferences(payload: UpdateUserPreferencesDTO): Promise<UserPreferences> {
    const { data } = await apiClient.patch<UserPreferences>("/me/preferences", payload)
    return data
  }
}

export const userOnboardingService = new UserOnboardingServiceClass()
