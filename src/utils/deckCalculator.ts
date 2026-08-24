import type { Deck, DeckStats, DeckMissingReport, MissingCardInfo } from '../types/deck';
import type { CollectionCardEntry } from '../types/collection';

export function isBasicEnergy(name?: string): boolean {
  if (!name) return false;
  return (
    name.includes('พลังงานพื้นฐาน') ||
    name.includes('Basic Energy') ||
    name.startsWith('Basic ') && name.endsWith(' Energy')
  );
}

export function isRadiantCard(name?: string): boolean {
  if (!name) return false;
  return name.includes('ส่องประกาย') || name.includes('Radiant');
}

export function isAceSpecCard(name?: string, colNum?: string): boolean {
  if (name && (name.includes('ACE SPEC') || name.includes('เอซสเปก'))) return true;
  if (colNum && colNum.toUpperCase().includes('ACE')) return true;
  return false;
}

export function calculateDeckStats(
  deck: Deck,
  cardDataMap: Map<string, any>
): DeckStats {
  let totalCards = 0;
  let pokemonCount = 0;
  let trainerCount = 0;
  let energyCount = 0;
  const ruleViolations: string[] = [];

  const nameCounts: Record<string, number> = {};
  let radiantCount = 0;
  let aceSpecCount = 0;

  for (const [cardId, entry] of Object.entries(deck.cards)) {
    const count = entry.count || 0;
    if (count <= 0) continue;

    totalCards += count;
    const card = cardDataMap.get(cardId);
    const name = card?.name || cardId;
    const category = card?.category || 'Pokemon';
    const colNum = card?.collectorNumber || card?.localId || '';

    if (category === 'Pokemon') pokemonCount += count;
    else if (category === 'Trainer') trainerCount += count;
    else if (category === 'Energy') energyCount += count;

    // Rule: Max 4 per name (except Basic Energy)
    if (!isBasicEnergy(name)) {
      nameCounts[name] = (nameCounts[name] || 0) + count;
      if (nameCounts[name] > 4) {
        ruleViolations.push(`การ์ด "${name}" เกิน 4 ใบ (มี ${nameCounts[name]} ใบ)`);
      }
    }

    // Rule: Max 1 Radiant
    if (isRadiantCard(name)) {
      radiantCount += count;
      if (radiantCount > 1) {
        ruleViolations.push(`การ์ดโปเกมอนส่องประกาย (Radiant) ใส่ได้ไม่เกิน 1 ใบต่อเด็ค`);
      }
    }

    // Rule: Max 1 ACE SPEC
    if (isAceSpecCard(name, colNum)) {
      aceSpecCount += count;
      if (aceSpecCount > 1) {
        ruleViolations.push(`การ์ด ACE SPEC ใส่ได้ไม่เกิน 1 ใบต่อเด็ค`);
      }
    }
  }

  if (totalCards !== 60) {
    if (totalCards < 60) {
      ruleViolations.push(`จำนวนการ์ดยังไม่ครบ 60 ใบ (ปัจจุบันมี ${totalCards} ใบ, ขาดอีก ${60 - totalCards} ใบ)`);
    } else {
      ruleViolations.push(`จำนวนการ์ดเกิน 60 ใบ (ปัจจุบันมี ${totalCards} ใบ, เกินมา ${totalCards - 60} ใบ)`);
    }
  }

  return {
    totalCards,
    pokemonCount,
    trainerCount,
    energyCount,
    isLegal60: ruleViolations.length === 0,
    ruleViolations,
  };
}

export function calculateMissingCards(
  deck: Deck,
  cardDataMap: Map<string, any>,
  userCollectionCards: Record<string, CollectionCardEntry> = {}
): DeckMissingReport {
  let totalCardsNeeded = 0;
  let totalCardsOwned = 0;
  let totalCardsMissing = 0;

  const missingItems: MissingCardInfo[] = [];
  const completeItems: MissingCardInfo[] = [];

  for (const [cardId, entry] of Object.entries(deck.cards)) {
    const countNeeded = entry.count || 0;
    if (countNeeded <= 0) continue;

    totalCardsNeeded += countNeeded;
    const card = cardDataMap.get(cardId);
    const name = card?.name || cardId;
    const category = card?.category || 'Pokemon';
    const types = card?.types || [];
    const setId = card?.set?.id || 'PROMO';
    const setName = card?.set?.name || 'การ์ดโปรโม / อื่น ๆ';
    const collectorNumber = card?.collectorNumber || card?.localId || '';
    const imageUrl = card?.imageUrl || '';

    // Calculate total copies owned across variants
    const collEntry = userCollectionCards[cardId];
    const variants = collEntry?.variants || { normal: 0, holo: 0, reverse: 0, promo: 0 };
    const ownedCount = variants.normal + variants.holo + variants.reverse + variants.promo;

    const countCredited = Math.min(countNeeded, ownedCount);
    totalCardsOwned += countCredited;

    const missingCount = Math.max(0, countNeeded - ownedCount);
    totalCardsMissing += missingCount;

    const info: MissingCardInfo = {
      cardId,
      name,
      category,
      types,
      setId,
      setName,
      collectorNumber,
      imageUrl,
      countNeeded,
      countOwned: ownedCount,
      missingCount,
    };

    if (missingCount > 0) {
      missingItems.push(info);
    } else {
      completeItems.push(info);
    }
  }

  const completionPercentage =
    totalCardsNeeded > 0
      ? Math.min(100, Math.round((totalCardsOwned / totalCardsNeeded) * 100))
      : 100;

  return {
    totalCardsNeeded,
    totalCardsOwned,
    totalCardsMissing,
    missingItems,
    completeItems,
    isComplete: totalCardsMissing === 0 && totalCardsNeeded > 0,
    completionPercentage,
  };
}

export function generateShoppingListText(deckName: string, report: DeckMissingReport): string {
  if (report.missingItems.length === 0) {
    return `🎉 เด็ค "${deckName}" มีการ์ดครบทั้งหมดแล้ว (100%) ไม่มีการ์ดที่ต้องหาเพิ่ม`;
  }

  const lines = [
    `📋 [รายการการ์ดที่ยังขาด] สำหรับเด็ค: ${deckName}`,
    `📊 ขาดทั้งหมด ${report.totalCardsMissing} ใบ (มีแล้ว ${report.totalCardsOwned}/${report.totalCardsNeeded} ใบ - ${report.completionPercentage}%)`,
    `----------------------------------------`,
  ];

  // Group by category
  const categories = ['Pokemon', 'Trainer', 'Energy'];
  const catNames: Record<string, string> = {
    Pokemon: '👾 โปเกมอน (Pokemon)',
    Trainer: '🎒 เทรนเนอร์ (Trainer)',
    Energy: '⚡ พลังงาน (Energy)',
  };

  for (const cat of categories) {
    const items = report.missingItems.filter((i) => i.category === cat);
    if (items.length > 0) {
      lines.push(`\n${catNames[cat]}:`);
      items.forEach((item) => {
        lines.push(` • ${item.name} (${item.setId} ${item.collectorNumber}) - ขาด ${item.missingCount} ใบ (ต้องการ ${item.countNeeded}, มีแล้ว ${item.countOwned})`);
      });
    }
  }

  lines.push(`\n----------------------------------------`);
  lines.push(`✨ สร้างจาก PokéCount Deck Builder`);
  return lines.join('\n');
}
