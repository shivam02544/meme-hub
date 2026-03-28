import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

try {
    oracledb.initOracleClient();
} catch (err) {
    console.error('Whoops! Thick mode error:', err);
}

// Global configuration to fetch CLOBs as strings to avoid handle leaks in JSON
oracledb.fetchAsString = [ oracledb.CLOB ];

let pool;

export async function initializeDatabase() {
    try {
        pool = await oracledb.createPool({
            user: process.env.DB_USER || 'system',
            password: process.env.DB_PASSWORD || 'password',
            connectString: process.env.DB_CONNECTION_STRING || 'localhost/xe',
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1
        });
        console.log('Oracle Database Pool Created Successfully');
    } catch (error) {
        console.error('Database connection failed', error);
        process.exit(1);
    }
}

export function getPool() {
    if (!pool) {
        throw new Error('Database pool has not been created');
    }
    return pool;
}

export async function closePoolAndExit() {
    console.log('\nTerminating Oracle DB connection pool');
    try {
        await pool.close(10);
        console.log('Oracle DB connection pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

// Handle SIGTERM and SIGINT for graceful shutdown
process.once('SIGTERM', closePoolAndExit).once('SIGINT', closePoolAndExit);
