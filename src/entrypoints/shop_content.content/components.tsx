import { clickLanguageButtons, clickMainUpdateButton, getShopIdFromUrl } from "./realUpdate";
import styles from "./shop_content.module.scss";

export function FixedDeactivateButton() {
  const handleClick = () => {
    const original = document.querySelector<HTMLInputElement>(
      'input#activate-button[type="submit"]',
    );
    original?.click();
  };

  return (
    <button onClick={handleClick} className={styles.deactivateButton}>
      Deactivate and update
    </button>
  );
}

export function FixedRealUpdateButton() {
  const [loading, setLoading] = useState(false);
  const shopId = getShopIdFromUrl();

  if (!shopId) return null;

  const handleClick = () => {
    setLoading(true);
    clickLanguageButtons(shopId);

    setTimeout(() => {
      clickMainUpdateButton();
      setTimeout(() => setLoading(false), 1000);
    }, 3000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={styles.realUpdateButton}
    >
      {loading ? "Aktualizuję..." : "realUpdate"}
    </button>
  );
}

export function PurgeButton() {
  const [loading, setLoading] = useState(false);

  const handlePurge = async () => {
    const aliasTd = document.querySelector("#aliasForURL");
    if (!aliasTd) return;

    const urls: { domain: string; content: string }[] = [];
    const anchors = aliasTd.querySelectorAll<HTMLAnchorElement>("a");

    anchors.forEach((alias) => {
      if (alias.href.includes("prologistics")) return;
      const url = new URL(alias.href);
      const domain = url.hostname.replace("www.", "");
      let link = url.pathname;
      if (!link.endsWith("/")) link += "/";
      urls.push({ domain, content: link });
    });

    if (urls.length === 0) {
      console.log("No URLs found to purge");
      return;
    }

    const domainGroups: Record<string, string[]> = {};
    urls.forEach(({ domain, content }) => {
      if (!domainGroups[domain]) domainGroups[domain] = [];
      domainGroups[domain].push(content);
    });

    setLoading(true);

    for (const domain of Object.keys(domainGroups)) {
      const formData = new FormData();
      formData.append("domain", domain);
      formData.append("prio", "1");
      formData.append("urls", domainGroups[domain].join("\n"));
      formData.append("purge", "Purge");

      try {
        await fetch("https://www.prologistics.info/purge.php", {
          method: "POST",
          body: formData,
        });
      } catch (err) {
        console.error("Error while purging:", err);
      }
    }

    setLoading(false);
    alert(`Purge completed! (urls: ${urls.length})`);
  };

  return (
    <button
      onClick={handlePurge}
      disabled={loading}
      className={styles.purgeButton}
    >
      {loading ? "Purging..." : "Purge"}
    </button>
  );
}