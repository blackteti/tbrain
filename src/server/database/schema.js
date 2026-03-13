import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import crypto from 'crypto';

const DB_PATH = path.join(__dirname, 'jarvis.sqlite');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // Must be 32 bytes (256-bit)
const IV_LENGTH = 16;

let dbInstance = null;

// AES-256-GCM Encryption
export function encryptData(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// AES-256-GCM Decryption
export function decryptData(encryptedData) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export const initDb = async () => {
    if (dbInstance) return dbInstance;

    const SQL = await initSqlJs();
    
    if (fs.existsSync(DB_PATH)) {
        const filebuffer = fs.readFileSync(DB_PATH);
        dbInstance = new SQL.Database(filebuffer);
        console.log("Database loaded from disk.");
    } else {
        dbInstance = new SQL.Database();
        
        // Users Table
        dbInstance.run(`
            CREATE TABLE Users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                preferences TEXT
            );
        `);

        // Memories Table (PARA Method)
        dbInstance.run(`
            CREATE TABLE Memories (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                memory_type TEXT CHECK(memory_type IN ('Fact', 'Goal', 'Preference')),
                scope TEXT CHECK(scope IN ('Projects', 'Areas', 'Resources', 'Archive')),
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, content) -- Deduplication logica
            );
        `);

        // Financial Transactions
        dbInstance.run(`
            CREATE TABLE Financial_Transactions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                type TEXT CHECK(type IN ('income', 'expense')),
                date DATETIME NOT NULL,
                description TEXT
            );
        `);

        // Habits and Goals
        dbInstance.run(`
            CREATE TABLE Habits_Goals (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                frequency TEXT NOT NULL,
                current_streak INTEGER DEFAULT 0,
                status TEXT CHECK(status IN ('active', 'archived', 'completed'))
            );
        `);

        // Telemetry IoT - Health Data
        // Important: 'value' col must be encrypted before inserting
        dbInstance.run(`
            CREATE TABLE Telemetry_Health_IoT (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                metric_type TEXT CHECK(metric_type IN ('hrv_stress', 'sleep_quality', 'hvac_energy')),
                value TEXT NOT NULL, 
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Agent Audit Logs - For tracking autonomous decisions
        dbInstance.run(`
            CREATE TABLE Agent_Audit_Logs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                action_type TEXT NOT NULL,
                payload TEXT,
                status TEXT CHECK(status IN ('success', 'failed', 'rolled_back')),
                rollback_data TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Performance Optimizer: SQLite Indexing (B-Trees)
        dbInstance.run(`
            CREATE INDEX idx_transactions_user_date ON Financial_Transactions(user_id, date);
            CREATE INDEX idx_memories_search ON Memories(user_id, scope);
            CREATE INDEX idx_telemetry_time ON Telemetry_Health_IoT(user_id, metric_type);
        `);

        saveDb();
        console.log("Database initialized and tables created.");
    }
    
    return dbInstance;
};

export const saveDb = () => {
    if (!dbInstance) return;
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
};

export const getDb = () => {
    if (!dbInstance) throw new Error("Database not initialized. Call initDb() first.");
    return dbInstance;
};
