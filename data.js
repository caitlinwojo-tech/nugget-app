/* =============================================================================
 * nugget — nutrient dataset
 * -----------------------------------------------------------------------------
 * CLINICAL REVIEW STATUS:
 *   - Micronutrient food values + servings: reviewed 2026-07-13 (founding physician).
 *   - Tofu zinc confirmed at 0.5 mg/oz (2026-07-13).
 *   - Daily targets: micronutrients CONFIRMED. Calorie RANGES, carbohydrate and fat
 *     targets added 2026-07-13 per physician spec (grams for infants; % of energy
 *     [AMDR] for ages 1+). Carbohydrate also carries the RDA in grams for ages 1-5.
 *   - Per-food `carbs` and `fat` grams: reviewed 2026-07-13 (founding physician).
 *   - 12 foods added + reviewed 2026-07-13 (blueberries, grapes, kiwi, clementine,
 *     pineapple, raspberries, watermelon, corn, green beans, white potato,
 *     summer squash, butter).
 *   - Breast milk + formula ADDED 2026-07-25 (per 1 oz) — ESTIMATES pending review.
 *     Breast milk vit D is low by design (why supplementation is advised); formula
 *     is iron- and vit-D-fortified.
 *   - White rice, brown rice, olive oil, cottage cheese added 2026-07-25, reviewed
 *     2026-07-31. Breast milk + formula also reviewed 2026-07-31. Full dataset +
 *     cautions physician-reviewed as of 2026-07-31.
 *   - Packaged foods (Little Spoon, Once Upon a Farm) removed pending barcode /
 *     photo-of-label capture.
 *
 * Micronutrients (single daily target, shown as bars): iron (mg), protein (g),
 *   calcium (mg), vitaminD (IU), zinc (mg), vitaminC (mg), fiber (g). Iron is hero.
 * Energy & macros (own section): calories (kcal, range), carbs (g), fat (g).
 *   Macro targets may be grams (`g`) and/or % of energy (`pctEnergy:[lo,hi]`, AMDR).
 * ============================================================================= */

window.NUGGET_DATA = {

  // Daily targets per age band.
  ageBands: [
    { id: "6-12m", label: "6–12 mo", daily: {
        iron: 11, protein: 11, calcium: 260, vitaminD: 400, zinc: 3, vitaminC: 50, fiber: null,
        calories: { min: 700, max: 900 },
        carbs: { g: 95 },          // AI (grams); no AMDR for infants
        fat:   { g: 30 }           // AI (grams) for infants
    } },
    { id: "1-3y", label: "1–3 yrs", daily: {
        iron: 7, protein: 13, calcium: 700, vitaminD: 600, zinc: 3, vitaminC: 15, fiber: 19,
        calories: { min: 900, max: 1400 },
        carbs: { g: 130, pctEnergy: [45, 65] },
        fat:   { pctEnergy: [30, 40] }
    } },
    { id: "4-5y", label: "4–5 yrs", daily: {
        iron: 10, protein: 19, calcium: 1000, vitaminD: 600, zinc: 5, vitaminC: 25, fiber: 25,
        calories: { min: 1200, max: 1600 },
        carbs: { g: 130, pctEnergy: [45, 65] },
        fat:   { pctEnergy: [25, 35] }
    } }
  ],

  // Micronutrients shown as bars (single daily target). Order = display order.
  nutrients: [
    { key: "iron",     label: "Iron",      unit: "mg",  hero: true },
    { key: "protein",  label: "Protein",   unit: "g" },
    { key: "calcium",  label: "Calcium",   unit: "mg" },
    { key: "vitaminD", label: "Vitamin D", unit: "IU" },
    { key: "zinc",     label: "Zinc",      unit: "mg" },
    { key: "vitaminC", label: "Vitamin C", unit: "mg" },
    { key: "fiber",    label: "Fiber",     unit: "g" }
  ],

  // Food groups, used for the simple "balance" check and grouping the picker.
  // "milkfeeds" is first — for 6-12mo, breast milk/formula is the primary feed.
  // "custom" holds parent-entered foods (from a package label); rendered only if present.
  groups: [
    { id: "milkfeeds", label: "Breast milk & formula" },
    { id: "protein",  label: "Proteins" },
    { id: "legume",   label: "Beans & lentils" },
    { id: "grain",    label: "Grains" },
    { id: "veg",      label: "Vegetables" },
    { id: "fruit",    label: "Fruit" },
    { id: "dairy",    label: "Dairy" },
    { id: "fat",      label: "Healthy fats" },
    { id: "packaged", label: "Store-bought" },
    { id: "community", label: "Community foods" },
    { id: "custom",   label: "Your foods" }
  ],

  // Prep / choking cautions by food id. Reviewed 2026-07-13 (founding physician).
  // Shown in the app when a food is selected, and flagged with ⚠️ on the chip.
  cautions: {
    grapes:       "Quarter lengthwise — whole grapes are a top choking hazard until about age 4.",
    blueberries:  "Smash or halve for new eaters.",
    peanut:       "Spread thin — never a thick glob or a spoonful on its own.",
    carrot:       "Cook until soft-mashable; no raw hard pieces.",
    beef:         "Finely mince or shred; no chunks.",
    chicken:      "Finely shred or mince; no chunks.",
    salmon:       "Flake well and check carefully for bones.",
    cheese:       "Serve as thin strips or shredded, not cubes or rounds.",
    corn:         "Serve off the cob; mash for younger babies.",
    whiterice:    "Under 6 months, mix into other food (like avocado or purée) so it's not loose kernels.",
    brownrice:    "Under 6 months, mix into other food (like avocado or purée) so it's not loose kernels.",
    cottagecheese:"Under 9 months, blend or mash the curds smooth; use small-curd varieties until about 12 months.",
    pineapple:    "Cut into small, thin pieces — it's fibrous.",
    clementine:   "Peel; remove seeds and the tough membrane.",
    watermelon:   "Remove seeds; cut into small, soft pieces.",
    greenbeans:   "Cook until soft; slice lengthwise, then into small pieces.",
    potato:       "Cook until soft; mash or small soft pieces.",
    sweetpotato:  "Cook until soft; mash or small soft pieces.",
    squash:       "Cook until soft-mashable.",
    summersquash: "Cook until soft-mashable."
  },

  // Foods. Values PER LISTED SERVING. Micronutrients reviewed 2026-07-13.
  // carbs & fat (grams) are ESTIMATES pending clinical review.
  // allergens: any of egg, dairy, fish, peanut, soy, wheat
  foods: [
    // ---- Breast milk & formula — per 1 oz. ESTIMATES pending clinical review. ----
    // Breast milk values are an average — real breast milk varies in nutrient content.
    { id: "breastmilk", name: "Breast milk",                emoji: "🤱", group: "milkfeeds", serving: "1 oz", allergens: [], n: { iron: 0,    protein: 0.3, calcium: 10, vitaminD: 1,  zinc: 0.05, vitaminC: 1.5, fiber: 0, carbs: 2.1, fat: 1.2, calories: 21 } },
    { id: "formula",    name: "Formula (prepared)",         emoji: "🍼", group: "milkfeeds", serving: "1 oz", allergens: ["dairy"], n: { iron: 0.36, protein: 0.4, calcium: 15, vitaminD: 12, zinc: 0.15, vitaminC: 1.8, fiber: 0, carbs: 2.2, fat: 1.1, calories: 20 } },

    { id: "ironcereal", name: "Iron-fortified baby cereal", emoji: "🥣", group: "grain", serving: "1/4 cup prepared", allergens: [], n: { iron: 7,   protein: 2,   calcium: 65,  vitaminD: 0,   zinc: 1,   vitaminC: 0,  fiber: 1,   carbs: 7, fat: 0.5, calories: 60 } },
    { id: "oatmeal",    name: "Oatmeal",                    emoji: "🌾", group: "grain", serving: "1/4 cup cooked",   allergens: [], n: { iron: 1,   protein: 2.5, calcium: 10,  vitaminD: 0,   zinc: 0.4, vitaminC: 0,  fiber: 2,   carbs: 7, fat: 1, calories: 75 } },
    { id: "pasta",      name: "Whole-wheat pasta",          emoji: "🍝", group: "grain", serving: "1/4 cup cooked",   allergens: ["wheat"], n: { iron: 0.5, protein: 2, calcium: 8, vitaminD: 0, zinc: 0.7, vitaminC: 0, fiber: 1.5, carbs: 9, fat: 0.2, calories: 45 } },
    { id: "whiterice",  name: "White rice (enriched)",      emoji: "🍚", group: "grain", serving: "1/4 cup cooked",   allergens: [], n: { iron: 0.6, protein: 1.1, calcium: 4, vitaminD: 0, zinc: 0.2, vitaminC: 0, fiber: 0.2, carbs: 11, fat: 0.1, calories: 52 } },
    { id: "brownrice",  name: "Brown rice",                 emoji: "🍚", group: "grain", serving: "1/4 cup cooked",   allergens: [], n: { iron: 0.2, protein: 1.3, calcium: 3, vitaminD: 0, zinc: 0.3, vitaminC: 0, fiber: 0.9, carbs: 11.5, fat: 0.4, calories: 55 } },

    { id: "beef",       name: "Ground beef",                emoji: "🥩", group: "protein", serving: "1 oz cooked", allergens: [], n: { iron: 0.8, protein: 8, calcium: 6.2, vitaminD: 0, zinc: 1.8, vitaminC: 0, fiber: 0, carbs: 0, fat: 5, calories: 73 } },
    { id: "chicken",    name: "Chicken",                    emoji: "🍗", group: "protein", serving: "1 oz cooked", allergens: [], n: { iron: 0.4, protein: 8.6, calcium: 5, vitaminD: 1, zinc: 0.3, vitaminC: 0, fiber: 0, carbs: 0, fat: 1.5, calories: 50 } },
    { id: "egg",        name: "Egg",                        emoji: "🥚", group: "protein", serving: "1 large",     allergens: ["egg"], n: { iron: 0.9, protein: 6.3, calcium: 28, vitaminD: 44, zinc: 0.6, vitaminC: 0, fiber: 0, carbs: 0.4, fat: 5, calories: 81 } },
    { id: "salmon",     name: "Salmon",                     emoji: "🐟", group: "protein", serving: "1 oz cooked", allergens: ["fish"], n: { iron: 0.1, protein: 6.3, calcium: 2.6, vitaminD: 148, zinc: 0.1, vitaminC: 0, fiber: 0, carbs: 0, fat: 3, calories: 61 } },
    { id: "tofu",       name: "Tofu",                       emoji: "⬜", group: "protein", serving: "1 oz",        allergens: ["soy"], n: { iron: 0.6, protein: 4.5, calcium: 149, vitaminD: 0, zinc: 0.5, vitaminC: 0, fiber: 1.5, carbs: 0.6, fat: 2, calories: 41 } },

    { id: "lentils",    name: "Lentils",                    emoji: "🟤", group: "legume", serving: "1/4 cup cooked", allergens: [], n: { iron: 1.6, protein: 4.5, calcium: 9.4, vitaminD: 0, zinc: 0.6, vitaminC: 0, fiber: 4, carbs: 10, fat: 0.2, calories: 60 } },
    { id: "blackbeans", name: "Black beans",                emoji: "🫘", group: "legume", serving: "1/4 cup cooked", allergens: [], n: { iron: 0.9, protein: 3.8, calcium: 12, vitaminD: 0, zinc: 0.5, vitaminC: 0, fiber: 3.7, carbs: 10, fat: 0.2, calories: 55 } },
    { id: "chickpeas",  name: "Chickpeas",                  emoji: "🟡", group: "legume", serving: "1/4 cup cooked", allergens: [], n: { iron: 1.2, protein: 3.5, calcium: 20, vitaminD: 0, zinc: 0.6, vitaminC: 0.3, fiber: 3, carbs: 11, fat: 1, calories: 70 } },

    { id: "spinach",    name: "Spinach",                    emoji: "🥬", group: "veg", serving: "1/4 cup cooked", allergens: [], n: { iron: 1.6, protein: 1.3, calcium: 60, vitaminD: 0, zinc: 0.3, vitaminC: 4, fiber: 1, carbs: 1.7, fat: 0.1, calories: 10 } },
    { id: "broccoli",   name: "Broccoli",                   emoji: "🥦", group: "veg", serving: "1/4 cup cooked", allergens: [], n: { iron: 0.3, protein: 1, calcium: 10, vitaminD: 0, zinc: 0.1, vitaminC: 13, fiber: 1.2, carbs: 1.5, fat: 0.1, calories: 14 } },
    { id: "peas",       name: "Peas",                       emoji: "🟢", group: "veg", serving: "1/4 cup",        allergens: [], n: { iron: 0.6, protein: 2, calcium: 10, vitaminD: 0, zinc: 0.4, vitaminC: 6, fiber: 2, carbs: 5, fat: 0.1, calories: 30 } },
    { id: "sweetpotato",name: "Sweet potato",               emoji: "🍠", group: "veg", serving: "1/4 cup mashed", allergens: [], n: { iron: 0.4, protein: 1, calcium: 10, vitaminD: 0, zinc: 0.2, vitaminC: 7, fiber: 1.5, carbs: 10, fat: 0, calories: 45 } },
    { id: "carrot",     name: "Carrot",                     emoji: "🥕", group: "veg", serving: "1/4 cup",        allergens: [], n: { iron: 0.1, protein: 0.3, calcium: 6, vitaminD: 0, zinc: 0.05, vitaminC: 1, fiber: 1, carbs: 3, fat: 0.1, calories: 13 } },
    { id: "squash",     name: "Butternut squash",           emoji: "🎃", group: "veg", serving: "1/4 cup",        allergens: [], n: { iron: 0.3, protein: 0.5, calcium: 20, vitaminD: 0, zinc: 0.1, vitaminC: 8, fiber: 1.5, carbs: 5, fat: 0.1, calories: 20 } },

    { id: "banana",     name: "Banana",                     emoji: "🍌", group: "fruit", serving: "1/2 medium",   allergens: [], n: { iron: 0.2, protein: 0.6, calcium: 3, vitaminD: 0, zinc: 0.1, vitaminC: 5, fiber: 1.5, carbs: 13, fat: 0.2, calories: 50 } },
    { id: "strawberry", name: "Strawberries",               emoji: "🍓", group: "fruit", serving: "1/4 cup",      allergens: [], n: { iron: 0.2, protein: 0.3, calcium: 6, vitaminD: 0, zinc: 0.05, vitaminC: 22, fiber: 0.7, carbs: 3, fat: 0.1, calories: 12 } },
    { id: "applesauce", name: "Applesauce",                 emoji: "🍎", group: "fruit", serving: "1/4 cup",      allergens: [], n: { iron: 0.1, protein: 0.1, calcium: 2, vitaminD: 0, zinc: 0, vitaminC: 1, fiber: 0.7, carbs: 7, fat: 0.1, calories: 25 } },

    { id: "milk",       name: "Whole milk (1 yr+)",         emoji: "🥛", group: "dairy", serving: "1/2 cup",      allergens: ["dairy"], n: { iron: 0, protein: 4, calcium: 150, vitaminD: 60, zinc: 0.5, vitaminC: 0, fiber: 0, carbs: 6, fat: 4, calories: 75 } },
    { id: "yogurt",     name: "Plain whole-milk Greek yogurt", emoji: "🥄", group: "dairy", serving: "1/4 cup",   allergens: ["dairy"], n: { iron: 0, protein: 5, calcium: 60, vitaminD: 0, zinc: 0.3, vitaminC: 0, fiber: 0, carbs: 2, fat: 2.5, calories: 54 } },
    { id: "cheese",     name: "Pasteurized whole-milk cheese", emoji: "🧀", group: "dairy", serving: "1/2 oz",    allergens: ["dairy"], n: { iron: 0.1, protein: 3.5, calcium: 100, vitaminD: 6, zinc: 0.4, vitaminC: 0, fiber: 0, carbs: 0.5, fat: 4.5, calories: 55 } },
    { id: "cottagecheese", name: "Cottage cheese (whole-milk)", emoji: "🧀", group: "dairy", serving: "1/4 cup", allergens: ["dairy"], n: { iron: 0, protein: 6, calcium: 40, vitaminD: 0, zinc: 0.2, vitaminC: 0, fiber: 0, carbs: 2, fat: 2.5, calories: 55 } },

    { id: "avocado",    name: "Avocado",                    emoji: "🥑", group: "fat", serving: "1/4 fruit",      allergens: [], n: { iron: 0.2, protein: 0.7, calcium: 4, vitaminD: 0, zinc: 0.2, vitaminC: 2.5, fiber: 2.5, carbs: 3, fat: 5.5, calories: 60 } },
    { id: "peanut",     name: "Peanut butter (thinned)",    emoji: "🥜", group: "fat", serving: "1 tbsp",         allergens: ["peanut"], n: { iron: 0.3, protein: 4, calcium: 7, vitaminD: 0, zinc: 0.4, vitaminC: 0, fiber: 1, carbs: 3, fat: 8, calories: 95 } },
    { id: "oliveoil",   name: "Olive oil",                  emoji: "🫒", group: "fat", serving: "1 tsp",          allergens: [], n: { iron: 0, protein: 0, calcium: 0, vitaminD: 0, zinc: 0, vitaminC: 0, fiber: 0, carbs: 0, fat: 4.5, calories: 40 } },

    // ---- Added 2026-07-13 — ESTIMATES pending clinical review ----
    { id: "blueberries", name: "Blueberries",              emoji: "🫐", group: "fruit", serving: "1/4 cup",       allergens: [], n: { iron: 0.1, protein: 0.3, calcium: 2,  vitaminD: 0, zinc: 0.05, vitaminC: 3.5, fiber: 0.9, carbs: 5.5, fat: 0.1,  calories: 21 } },
    { id: "grapes",      name: "Grapes (quartered)",       emoji: "🍇", group: "fruit", serving: "1/4 cup",       allergens: [], n: { iron: 0.1, protein: 0.3, calcium: 3,  vitaminD: 0, zinc: 0.02, vitaminC: 1,   fiber: 0.4, carbs: 7,   fat: 0.1,  calories: 26 } },
    { id: "kiwi",        name: "Kiwi",                     emoji: "🥝", group: "fruit", serving: "1/4 cup",       allergens: [], n: { iron: 0.1, protein: 0.3, calcium: 15,  vitaminD: 0, zinc: 0.04, vitaminC: 42,  fiber: 1.4, carbs: 7, fat: 0.1,  calories: 27 } },
    { id: "clementine",  name: "Clementine (cutie)",       emoji: "🍊", group: "fruit", serving: "1 small",       allergens: [], n: { iron: 0.1, protein: 0.6, calcium: 22, vitaminD: 0, zinc: 0.05, vitaminC: 36,  fiber: 1.3, carbs: 9,   fat: 0.1,  calories: 35 } },
    { id: "pineapple",   name: "Pineapple",                emoji: "🍍", group: "fruit", serving: "1/4 cup",       allergens: [], n: { iron: 0.1, protein: 0.2, calcium: 5,  vitaminD: 0, zinc: 0.03, vitaminC: 20,  fiber: 0.6, carbs: 5.5, fat: 0.05, calories: 20 } },
    { id: "raspberries", name: "Raspberries",              emoji: "🍒", group: "fruit", serving: "1/4 cup",       allergens: [], n: { iron: 0.2, protein: 0.4, calcium: 8,  vitaminD: 0, zinc: 0.1,  vitaminC: 8,   fiber: 2,   carbs: 3.7, fat: 0.2,  calories: 16 } },
    { id: "watermelon",  name: "Watermelon",               emoji: "🍉", group: "fruit", serving: "1/4 cup",       allergens: [], n: { iron: 0.1, protein: 0.2, calcium: 2,  vitaminD: 0, zinc: 0.03, vitaminC: 2,   fiber: 0.2, carbs: 2.9, fat: 0.05, calories: 11 } },
    { id: "corn",        name: "Corn",                     emoji: "🌽", group: "veg", serving: "1/4 cup",         allergens: [], n: { iron: 0.1, protein: 1.2, calcium: 1,  vitaminD: 0, zinc: 0.1,  vitaminC: 1.5, fiber: 1,   carbs: 8, fat: 0.5,  calories: 33 } },
    { id: "greenbeans",  name: "Green beans",              emoji: "🫛", group: "veg", serving: "1/4 cup cooked",  allergens: [], n: { iron: 0.3, protein: 0.6, calcium: 14, vitaminD: 0, zinc: 0.1,  vitaminC: 3,   fiber: 1.3, carbs: 2.5, fat: 0.1,  calories: 11 } },
    { id: "potato",      name: "White potato",             emoji: "🥔", group: "veg", serving: "1/4 cup mashed",  allergens: [], n: { iron: 0.2, protein: 1,   calcium: 4,  vitaminD: 0, zinc: 0.1,  vitaminC: 5,   fiber: 1,   carbs: 10,  fat: 0.1,  calories: 45 } },
    { id: "summersquash",name: "Summer squash (zucchini)", emoji: "🥒", group: "veg", serving: "1/4 cup",         allergens: [], n: { iron: 0.1, protein: 0.4, calcium: 10,  vitaminD: 0, zinc: 0.1,  vitaminC: 4,   fiber: 0.5, carbs: 2,   fat: 0.1,  calories: 9 } },
    { id: "butter",      name: "Butter",                   emoji: "🧈", group: "fat", serving: "1 tsp",           allergens: ["dairy"], n: { iron: 0, protein: 0, calcium: 1, vitaminD: 3, zinc: 0, vitaminC: 0, fiber: 0, carbs: 0, fat: 3.9, calories: 34 } }
  ]
};
