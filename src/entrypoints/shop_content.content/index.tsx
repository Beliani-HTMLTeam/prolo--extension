import { createRoot } from "react-dom/client";
import { App } from "./App";

export default defineContentScript({
  matches: ["*://*.prologistics.info/shop_content.php*"],
 main() {
    const container = document.createElement("div");
    container.id = "prolo-extension-react-root";
    document.body.appendChild(container);

    createRoot(container).render(<App />);
  },
});