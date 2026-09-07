export interface CategoryRule {
  requiresRegion: boolean;
  requiresQuestType: boolean;
}

export interface QuestTypeRule {
  isRegionSpecific: boolean;
}

/**
 * Region wajib diisi jika:
 * - kategori memang mewajibkan region secara langsung (requiresRegion), ATAU
 * - kategori mewajibkan quest type (requiresQuestType) DAN quest type yang
 *   dipilih itu region-specific (isRegionSpecific).
 */
export function isRegionRequired(
  category: CategoryRule,
  questType: QuestTypeRule | null
): boolean {
  if (category.requiresRegion) return true;
  if (category.requiresQuestType && questType?.isRegionSpecific) return true;
  return false;
}

/**
 * Quest type wajib diisi jika kategori mewajibkannya.
 */
export function isQuestTypeRequired(category: CategoryRule): boolean {
  return category.requiresQuestType;
}

export interface JokiItemFormInput {
  categoryRequiresRegion: boolean;
  categoryRequiresQuestType: boolean;
  questTypeIsRegionSpecific: boolean | null; // null jika belum pilih quest type
  regionId: string | null;
  questTypeId: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validasi server-side sebelum create/update JokiItem: memastikan
 * region/quest type diisi ketika aturan mewajibkannya, dan tidak
 * mengirim region/quest type yang tidak relevan untuk kategori tsb.
 */
export function validateJokiItemRelations(input: JokiItemFormInput): ValidationResult {
  const errors: string[] = [];

  const questTypeRequired = input.categoryRequiresQuestType;
  if (questTypeRequired && !input.questTypeId) {
    errors.push("Kategori ini mewajibkan pengisian Jenis Quest.");
  }

  const regionRequired = isRegionRequired(
    { requiresRegion: input.categoryRequiresRegion, requiresQuestType: input.categoryRequiresQuestType },
    input.questTypeId ? { isRegionSpecific: !!input.questTypeIsRegionSpecific } : null
  );
  if (regionRequired && !input.regionId) {
    errors.push("Kombinasi kategori/jenis quest ini mewajibkan pengisian Region.");
  }

  return { valid: errors.length === 0, errors };
}
