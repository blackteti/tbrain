const Parser = require('rss-parser');
const parser = new Parser({
    headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
});

async function fetchNews() {
    try {
        const BR_RSS = 'https://g1.globo.com/rss/g1/economia/';
        const WORLD_RSS = 'http://feeds.bbci.co.uk/portuguese/rss.xml';

        const [brRes, worldRes] = await Promise.all([
            parser.parseURL(BR_RSS).catch(e => { console.error("[NewsService] Falha no BR RSS:", e.message); return { items: [] }; }),
            parser.parseURL(WORLD_RSS).catch(e => { console.error("[NewsService] Falha no World RSS:", e.message); return { items: [] }; })
        ]);

        const formatNews = (items, source) => {
            if (!items || !Array.isArray(items)) return [];
            return items.slice(0, 8).map(item => ({
                title: item.title,
                summary: item.contentSnippet ? item.contentSnippet.substring(0, 120).trim() + '...' : (item.content ? item.content.replace(/<[^>]+>/g, '').substring(0, 120).trim() + '...' : ''),
                source: source,
                url: item.link || "#"
            }));
        };

        const allNews = [
            ...formatNews(brRes.items, 'G1 Economia'),
            ...formatNews(worldRes.items, 'BBC News')
        ];

        return {
            global: allNews,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error("[NewsService] Falha nativa ao buscar RSS:", error.message);
        return { global: [], timestamp: new Date().toISOString() };
    }
}

module.exports = { fetchNews };
