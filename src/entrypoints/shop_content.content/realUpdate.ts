import { shopLanguageMap } from "./types/types";


export function getShopIdFromUrl(): string | null {
  const match = window.location.href.match(/shop_id=(\d+)/);
  return match ? match[1] : null;
}

export function clickLanguageButtons(shopId: string): void {
  const languages = shopLanguageMap[shopId];
  if (!languages) return;

  console.log(
    `Klikanie przycisków dla języków w shop_id=${shopId}: ${languages.join(", ")}`,
  );

  languages.forEach((language) => {
    const buttons = document.querySelectorAll<HTMLInputElement>(
      `input[type="button"][onclick*="updateHtml(this, '${language}'"][value="Update"]`,
    );

    if (buttons.length === 0) {
      console.log(`⚠️ Nie znaleziono przycisku dla języka: ${language}`);
    }

    buttons.forEach((button) => {
      console.log(`✅ Kliknięcie przycisku dla języka: ${language}`);
      button.click();
    });
  });
}

export function clickMainUpdateButton(): void {
  const updateButtons = document.querySelectorAll<HTMLInputElement>(
    'input.update-btn[type="button"][value="Update"]',
  );

  if (updateButtons.length > 0) {
    console.log("Kliknięcie głównego przycisku Update");
    updateButtons[0].click();
  } else {
    console.log("Nie znaleziono głównego przycisku Update");
  }
}