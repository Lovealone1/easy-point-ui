import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userOnboardingService } from "../services/user-onboarding.service"
import type {
  OnboardingGoal,
  UpdateReminderPreferencesDTO,
  UpdateUserPreferencesDTO,
} from "../types/user-onboarding.types"

export const onboardingKeys = {
  all: ["user-onboarding"] as const,
  state: () => [...onboardingKeys.all, "state"] as const,
  goals: () => [...onboardingKeys.all, "goals"] as const,
  preferences: () => ["user-preferences"] as const,
}

/** Drives wizard resume: the server is the source of truth for the step. */
export function useOnboardingState() {
  return useQuery({
    queryKey: onboardingKeys.state(),
    queryFn: () => userOnboardingService.getState(),
  })
}

export function useOnboardingGoals() {
  return useQuery({
    queryKey: onboardingKeys.goals(),
    queryFn: () => userOnboardingService.getGoals(),
    staleTime: Infinity, // fixed pool, backed by an enum
  })
}

export function useUserPreferences() {
  return useQuery({
    queryKey: onboardingKeys.preferences(),
    queryFn: () => userOnboardingService.getPreferences(),
  })
}

/**
 * Every step mutation returns the whole state, so it is written straight into
 * the cache — the wizard never has to refetch to know where it stands.
 */
function useStepMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<Awaited<ReturnType<typeof userOnboardingService.getState>>>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (state) => {
      queryClient.setQueryData(onboardingKeys.state(), state)
      queryClient.invalidateQueries({ queryKey: onboardingKeys.preferences() })
    },
  })
}

export function useSetOnboardingGoal() {
  return useStepMutation((goal: OnboardingGoal) => userOnboardingService.setGoal(goal))
}

export function useSetOnboardingRegion() {
  return useStepMutation(({ timezone, preferredCurrency }: { timezone: string; preferredCurrency: string }) =>
    userOnboardingService.setRegion(timezone, preferredCurrency)
  )
}

export function useSetOnboardingReminders() {
  return useStepMutation((payload: UpdateReminderPreferencesDTO) =>
    userOnboardingService.setReminders(payload)
  )
}

export function useCompleteOnboarding() {
  return useStepMutation(() => userOnboardingService.complete())
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateUserPreferencesDTO) => userOnboardingService.updatePreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.preferences() })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state() })
      // Totals are rendered in the preferred currency.
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] })
    },
  })
}
