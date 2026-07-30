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