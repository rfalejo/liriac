export function showBlockUpdateErrorToast(error: unknown) {
  // Surface save failures consistently; real toast system can replace alert later.
  if (error instanceof Error) {
    console.error("Block update failed:", error.message, error);
  } else {
    console.error("Block update failed:", error);
  }
  window.alert("No se pudieron guardar los cambios. Intenta de nuevo.");
}
