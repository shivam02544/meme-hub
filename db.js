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
    
    // Lazy patch to intercept connections for System Monitor
    if (!pool._isPatched) {
        const originalGetConnection = pool.getConnection.bind(pool);
        pool.getConnection = async () => {
            const conn = await originalGetConnection();
            if (!conn._isPatched) {
                const originalExecute = conn.execute.bind(conn);
                conn.execute = async function() {
                    const sql = arguments[0] || '';
                    const binds = arguments[1] || {};

                    const logEntry = {
                        id: Date.now() + Math.random().toString(36).substring(2, 9),
                        timestamp: new Date().toISOString(),
                        sql: typeof sql === 'string' ? sql.replace(/\s+/g, ' ').trim() : '',
                        binds: binds ? JSON.stringify(binds) : '{}'
                    };
                    
                    // Do not log the queries used by the System Monitor itself!
                    if (typeof sql === 'string' && !sql.toLowerCase().includes('activity_logs')) {
                        if (!global.systemLogs) global.systemLogs = [];
                        global.systemLogs.unshift(logEntry);
                        if (global.systemLogs.length > 50) global.systemLogs.pop();
                    }
                    
                    return await originalExecute.apply(conn, arguments);
                };
                conn._isPatched = true;
            }
            return conn;
        };
        pool._isPatched = true;
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
