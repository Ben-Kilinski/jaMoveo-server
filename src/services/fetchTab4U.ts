import fetch from 'node-fetch';
import * as cheerio from 'cheerio';


export async function fetchChordsAndLyricsFromTab4U(
    title: string,
    artist: string
): Promise<{ lyrics: string | null; chords: string | null }> {
    const searchUrl = `https://www.tab4u.com/search.php?keyword=${encodeURIComponent(title)}&x=0&y=0`;
    console.log('🔗 URL de busca:', searchUrl);


    try {
        const searchRes = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'text/html',
            }
        });

        const searchHtml = await searchRes.text();
        console.log('🔎 HTML da busca Tab4U:');
        console.log(searchHtml.slice(0, 1000)); // mostra um pedaço do HTML da busca

        const $ = cheerio.load(searchHtml);

        const firstLink = $('table a')
            .map((_, el) => $(el).attr('href'))
            .get()
            .find((href) => href?.includes('tabs'));

        if (!firstLink) {
            return { lyrics: null, chords: null };
        }

        const songUrl = `https://www.tab4u.com${firstLink}`;
        const songRes = await fetch(songUrl);
        const songHtml = await songRes.text();
        const $songPage = cheerio.load(songHtml);

        const chords = $songPage('.songtextpre').first().text().trim();

        return {
            lyrics: chords,
            chords,
        };
    } catch (err) {
        console.error('Erro ao buscar do Tab4U:', err);
        return { lyrics: null, chords: null };
    }
}
