import axios from 'axios';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2022-06-28';

const notionClient = axios.create({
    baseURL: 'https://api.notion.com/v1',
    headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
    }
});

// A Task Queue based on Promises implementing Exponential Backoff
class NotionTaskQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const { task, resolve, reject } = this.queue.shift();
            try {
                // Rate Limiting Control (HTTP 429)
                const result = await this.executeWithBackoff(task);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }
        
        this.isProcessing = false;
    }

    async executeWithBackoff(task, retries = 5, delay = 1000) {
        try {
            return await task();
        } catch (error) {
            if (error.response && error.response.status === 429 && retries > 0) {
                // Retry-After Header parsing
                const retryAfterHeader = error.response.headers['retry-after'];
                const waitTime = retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : delay * 2;
                
                console.warn(`[Notion Rate Limit] 429 Hit. Waiting ${waitTime}ms. Retries left: ${retries}`);
                await new Promise(res => setTimeout(res, waitTime));
                
                return this.executeWithBackoff(task, retries - 1, waitTime);
            }
            throw new Error(`Task failed permanently: ${error.message} - Data: ${JSON.stringify(error.response?.data)}`);
        }
    }
}

const queue = new NotionTaskQueue();

// Size Limits & Chunking (Max 100 items per array, string size < 2000, 500KB total)
export async function appendBlocksChunked(blockId, allBlocks) {
    if (!blockId || !allBlocks || !Array.isArray(allBlocks)) {
        throw new Error("Invalid parameters to appendBlocksChunked");
    }

    const CHUNK_SIZE = 100;
    
    // Safety check for depth and string lengths logic should go here...
    const cleanBlocks = allBlocks.map(block => {
        // Enforce max string length (2000 chars limit on Notion rich_text)
        if (block[block.type] && block[block.type].rich_text) {
             block[block.type].rich_text.forEach(rt => {
                 if (rt.text && rt.text.content && rt.text.content.length > 2000) {
                     rt.text.content = rt.text.content.substring(0, 1997) + '...';
                 }
             });
        }
        return block;
    });

    const chunks = [];
    for (let i = 0; i < cleanBlocks.length; i += CHUNK_SIZE) {
        chunks.push(cleanBlocks.slice(i, i + CHUNK_SIZE));
    }

    // Process PATCH /v1/blocks/{id}/children sequentially via Queue
    const results = [];
    for (const chunk of chunks) {
        const result = await queue.enqueue(() => 
             notionClient.patch(`/blocks/${blockId}/children`, { children: chunk })
        );
        results.push(result.data);
    }

    return results;
}

// Sync Habit / Memory to Notion Database
export async function syncMemoryToNotion(databaseId, paramProperties) {
    // Limits max string lengths recursively in paramProperties if necessary
    return queue.enqueue(() => 
        notionClient.post('/pages', {
            parent: { database_id: databaseId },
            properties: paramProperties
        })
    );
}

export default { appendBlocksChunked, syncMemoryToNotion };
