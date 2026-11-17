/** The header and mobile bar ask the library page to open the palette. */
export const OPEN_PALETTE_EVENT = "cmdkit:open-palette";

export const openPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
