const SAMPLE_TEXT = "Zażółć gęślą jaźń";

export async function loadGraphicFonts() {
  const loaded = await Promise.all([
    document.fonts.load('500 24px "Poppins"', SAMPLE_TEXT),
    document.fonts.load('600 64px "Poppins"', SAMPLE_TEXT),
    document.fonts.load('700 32px "Poppins"', SAMPLE_TEXT),
    document.fonts.load('400 28px "Roboto"', SAMPLE_TEXT),
  ]);
  if (loaded.some((fonts) => fonts.length === 0))
    throw new Error(
      "Nie udało się wczytać fontów. Odśwież stronę i spróbuj ponownie.",
    );
}
