import puppeteer from 'puppeteer';

export async function fetchChordsAndLyricsFromTab4U(title: string, artist: string): Promise<{ lyrics: string | null, chords: string | null }> {
  const query = encodeURIComponent(title);
  const searchUrl = `https://www.tab4u.com/search.php?keyword=${query}`;

  const browser = await puppeteer.launch({ headless: true });
; // 'new' para evitar warning
  const page = await browser.newPage();

  try {
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // Clicar no primeiro link da tabela de resultados
    const songLink = await page.evaluate(() => {
      const link = document.querySelector('table a[href*="tabs"]') as HTMLAnchorElement;
      return link?.getAttribute('href') || null;
    });

    if (!songLink) {
      await browser.close();
      return { lyrics: null, chords: null };
    }

    const songUrl = `https://www.tab4u.com${songLink}`;
    await page.goto(songUrl, { waitUntil: 'networkidle2' });

    const chords = await page.evaluate(() => {
      const el = document.querySelector('.songtextpre');
      return el?.textContent?.trim() || null;
    });

    await browser.close();

    return {
      lyrics: chords, // Tab4U embute letra + cifra no mesmo bloco
      chords,
    };
  } catch (err) {
    console.error('Erro no Puppeteer:', err);
    await browser.close();
    return { lyrics: null, chords: null };
  }

  
}
// Teste direto (só roda se esse arquivo for executado diretamente)
if (require.main === module) {
  (async () => {
    const result = await fetchChordsAndLyricsFromTab4U("מישהו", "עידן רייכל");
    console.log("🎼 LETRA:\n", result.lyrics || 'Nada');
    console.log("🎸 CIFRA:\n", result.chords || 'Nada');
  })();
}
