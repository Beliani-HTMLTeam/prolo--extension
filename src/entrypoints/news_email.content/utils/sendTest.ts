export type LoggedUser = {
  email: string;
  id?: string;
  [key: string]: unknown;
};

export type CustomerOption = {
  id: string;
  title: string;
};

export const SEND_TO_USERS = {
  'TL+Managers': {
    JChmielewska: 'Shop#2478629: Justyna Chmielewska chmielewska@beliani.fr',
    RKobus: 'Shop#4280939: Rafał Kobus rafal.kobus@beliani.net',
  },
  'Test Mobile': {
    TestPhone: 'Shop#2476929: Calendar Beliani calendar@beliani.co.uk',
  },
  HTML: {
    KKazaniecki: 'Shop#6239524: Kamil Kazaniecki kamil.kazaniecki@beliani.net',
    DKrapyvianskyi: 'Shop#7253514: Dmytro Krapyvianskyi dmytro.krapyvianskyi@beliani.com',
    JaGajowiecki: 'Shop#7875098: Jakub Gajowiecki jakub.gajowiecki@beliani.net',
    KrBiranowski: 'Shop#8256838: Krzysztof Biranowski krzysztof.biranowski@beliani.net',
  },
  Graphics: {
    AHrymnak: 'Shop#7622688: Adriana Hrymnak andriana.hrymnak@beliani.net',
    AWagner: 'Shop#7602049: Agata Wagner agata.wagner@beliani.net',
    AMyryk: 'Shop#5509192: Anastasiia Myryk a.myryk@beliani.net',
  },
} as const;

export function getUserData(): LoggedUser | null {
  const script = [...document.querySelectorAll('script')].find(s =>
    s.textContent?.includes('var LOGGED_USER'),
  );
  if (!script?.textContent) return null;

  const match = script.textContent.match(/var\s+LOGGED_USER\s*=\s*({[\s\S]*?});/);
  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]) as LoggedUser;
  } catch {
    return null;
  }
}

export function getUserEmail(): string | null {
  return getUserData()?.email ?? null;
}

export async function fetchCustomerByEmail(email: string): Promise<CustomerOption | null> {
  const res = await fetch(
    `https://www.prologistics.info/getCustomer.php?input=${encodeURIComponent(email)}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { accept: '*/*' },
    },
  );

  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const item = doc.querySelector('rs');
  if (!item) return null;

  return {
    id: item.getAttribute('id') ?? '',
    title: item.textContent ?? '',
  };
}

export function setTestCustomerAndSend(mailTo: string, customerId: string): void {
  const testCustomerInput = document.querySelector<HTMLInputElement>('#test_customer');
  const testCustomerIdInput = document.querySelector<HTMLInputElement>('#test_customer_id');
  const sendTestButton = document.querySelector<HTMLElement>("[name='sendtest']");

  if (!testCustomerInput || !testCustomerIdInput || !sendTestButton) {
    console.error('Test customer inputs or send button not found');
    return;
  }

  testCustomerInput.value = mailTo;
  testCustomerIdInput.value = customerId;
  sendTestButton.click();
}

export function parseCustomerIdFromValue(value: string): string {
  // "Shop#2478629: Justyna ..." → "-2478629"
  const shopPart = value.split(':')[0] ?? '';
  return `-${shopPart.replace('Shop#', '')}`;
}

export function extractEmailFromValue(value: string): string {
  return value.trim().split(' ').pop() ?? '';
}