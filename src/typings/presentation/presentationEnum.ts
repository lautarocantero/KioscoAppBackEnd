export enum PresentationCategory {
  // Food
  Food = "food",
  Grocery = "grocery",
  Bakery = "bakery",
  Dairy = "dairy",
  DeliAndCheese = "deli_and_cheese",
  MeatsAndColdCuts = "meats_and_cold_cuts",
  FruitsAndVegetables = "fruits_and_vegetables",
  Frozen = "frozen",
  Snacks = "snacks",
  CookiesAndPastries = "cookies_and_pastries",
  CondimentsAndSauces = "condiments_and_sauces",

  // Beverages
  NonAlcoholicBeverages = "non_alcoholic_beverages",
  AlcoholicBeverages = "alcoholic_beverages",
  HotBeverages = "hot_beverages",

  // Personal care
  PersonalHygiene = "personal_hygiene",
  HairCare = "hair_care",
  Cosmetics = "cosmetics",

  // Household
  HouseholdCleaning = "household_cleaning",
  Disposables = "disposables",

  // Other
  Baby = "baby",
  Pets = "pets",
  Pharmacy = "pharmacy",
  TobaccoAndCigarettes = "tobacco_and_cigarettes",
  StationeryAndKiosk = "stationery_and_kiosk",
  Deli = "deli",
}

export const PRESENTATION_CATEGORY_VALUES: string[] = Object.values(PresentationCategory);

export const SALE_TYPE_VALUES = ['unit', 'weight'] as const;
export type SaleType = typeof SALE_TYPE_VALUES[number];

// Formato / envase de la presentación
export enum ModelType {
  Can = "can",
  Bottle = "bottle",
  TetraPack = "tetra_pack",
  Bag = "bag",
  Box = "box",
  Jar = "jar",
  Sachet = "sachet",
  Blister = "blister",
  Pack = "pack",
  Roll = "roll",
  Aerosol = "aerosol",
  SoftCover = "soft_cover",
  HardCover = "hard_cover",
  Other = "other",
}

export const MODEL_TYPE_VALUES: string[] = Object.values(ModelType);

// Unidad de medida del tamaño (model_size)
export enum ModelUnit {
  Units = "units",
  Milliliters = "ml",
  Liters = "l",
  Grams = "g",
  Kilograms = "kg",
  Ounces = "oz",
  Pounds = "lb",
  Sheets = "sheets",
  Meters = "m",
  Centimeters = "cm",
}

export const MODEL_UNIT_VALUES: string[] = Object.values(ModelUnit);