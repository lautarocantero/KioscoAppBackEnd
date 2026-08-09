export enum NeedsReviewReason {
  RubroSinMapeo = "rubro_sin_mapeo",
  ModelSizeUnitNoDetectado = "model_size_unit_no_detectado",
  ModelTypeNoDetectado = "model_type_no_detectado",
  SinBarcode = "sin_barcode",
}

export const NEEDS_REVIEW_REASON_VALUES: string[] = Object.values(NeedsReviewReason);