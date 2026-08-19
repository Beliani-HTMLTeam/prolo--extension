import { createPortal } from "react-dom";
import { FixedDeactivateButton, FixedRealUpdateButton, PurgeButton } from "./components";

export function App() {
  const langContainer = document.querySelector(".lang_select_container");

  return (
    <>
      <FixedDeactivateButton />
      <FixedRealUpdateButton />

      {/* Render Purge button next to the language selector */}
      {langContainer &&
        createPortal(<PurgeButton />, langContainer.parentElement!)}
    </>
  );
}