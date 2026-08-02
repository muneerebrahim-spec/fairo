export type RootStackParamList = {
  Home: undefined
  Capture: undefined
  Processing: undefined
  CorrectionMode: undefined
  ReviewStepThrough: undefined
  ReviewFullList: undefined
  AdjustmentPrompt: { adjustmentId: string }
  Participants: undefined
  SplitMode: undefined
  AssignItems: undefined
  Reconciliation: undefined
  Tip: undefined
  PercentageSplit: undefined
  Summary: { readonly: boolean; splitId?: string }
}
