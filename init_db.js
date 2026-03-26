import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

try {
    oracledb.initOracleClient();
} catch (err) {
    console.error('Whoops! Thick mode error:', err);
}

const statements = [
    // 1. Categories
    `CREATE TABLE Categories (
        category_id NUMBER PRIMARY KEY,
        name VARCHAR2(100) UNIQUE NOT NULL,
        description VARCHAR2(255)
    )`,
    `CREATE SEQUENCE categories_seq START WITH 1 INCREMENT BY 1`,
    `CREATE OR REPLACE TRIGGER categories_bir
    BEFORE INSERT ON Categories
    FOR EACH ROW
    BEGIN
      SELECT categories_seq.NEXTVAL INTO :new.category_id FROM dual;
    END;`,

    // 2. Users
    `CREATE TABLE Users (
        user_id NUMBER PRIMARY KEY,
        name VARCHAR2(100) NOT NULL,
        email VARCHAR2(100) UNIQUE NOT NULL,
        password_hash VARCHAR2(255) NOT NULL,
        is_verified NUMBER(1) DEFAULT 0 CHECK (is_verified IN (0, 1)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1`,
    `CREATE OR REPLACE TRIGGER users_bir
    BEFORE INSERT ON Users
    FOR EACH ROW
    BEGIN
      SELECT users_seq.NEXTVAL INTO :new.user_id FROM dual;
    END;`,

    // 3. Memes
    `CREATE TABLE Memes (
        meme_id NUMBER PRIMARY KEY,
        user_id NUMBER NOT NULL,
        category_id NUMBER,
        title VARCHAR2(255) NOT NULL,
        image_url VARCHAR2(1000) NOT NULL,
        description CLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        CONSTRAINT fk_memes_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_memes_category FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
    )`,
    `CREATE SEQUENCE memes_seq START WITH 1 INCREMENT BY 1`,
    `CREATE OR REPLACE TRIGGER memes_bir
    BEFORE INSERT ON Memes
    FOR EACH ROW
    BEGIN
      SELECT memes_seq.NEXTVAL INTO :new.meme_id FROM dual;
    END;`,

    // 4. OTP Logs
    `CREATE TABLE OTP_Logs (
        otp_id NUMBER PRIMARY KEY,
        email VARCHAR2(100) NOT NULL,
        otp_code VARCHAR2(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used NUMBER(1) DEFAULT 0 CHECK (is_used IN (0, 1)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_otp_email FOREIGN KEY (email) REFERENCES Users(email) ON DELETE CASCADE
    )`,
    `CREATE SEQUENCE otplogs_seq START WITH 1 INCREMENT BY 1`,
    `CREATE OR REPLACE TRIGGER otplogs_bir
    BEFORE INSERT ON OTP_Logs
    FOR EACH ROW
    BEGIN
      SELECT otplogs_seq.NEXTVAL INTO :new.otp_id FROM dual;
    END;`,

    // 5. Activity Logs
    `CREATE TABLE Activity_Logs (
        log_id NUMBER PRIMARY KEY,
        user_id NUMBER NOT NULL,
        action VARCHAR2(100) NOT NULL,
        details CLOB,
        log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    )`,
    `CREATE SEQUENCE activitylogs_seq START WITH 1 INCREMENT BY 1`,
    `CREATE OR REPLACE TRIGGER activitylogs_bir
    BEFORE INSERT ON Activity_Logs
    FOR EACH ROW
    BEGIN
      SELECT activitylogs_seq.NEXTVAL INTO :new.log_id FROM dual;
    END;`,

    // Default Inserts
    `INSERT INTO Categories (name, description) VALUES ('Dank Memes', 'The dankest of the dank.')`,
    `INSERT INTO Categories (name, description) VALUES ('Wholesome', 'Memes that make you smile.')`,
    `INSERT INTO Categories (name, description) VALUES ('Programming', 'Relatable dev struggles.')`,
    `INSERT INTO Categories (name, description) VALUES ('Animals', 'Funny pets and wildlife.')`
];

async function run() {
    let connection;
    try {
        console.log("Connecting to Database...");
        connection = await oracledb.getConnection({
            user: process.env.DB_USER || 'system',
            password: process.env.DB_PASSWORD || 'password',
            connectString: process.env.DB_CONNECTION_STRING || 'localhost/xe'
        });

        console.log("Connected! Creating Oracle 11g robust schema...");
        
        for (const sql of statements) {
            try {
                await connection.execute(sql);
                console.log(`Executed: ${sql.substring(0, 50).trim().split('\\n')[0]}...`);
            } catch (err) {
                // Ignore "name is already used by an existing object"
                if (err.errorNum === 955) {
                    // console.log("Already exists, skipping.");
                } else if (err.errorNum === 4080) {
                    // Ignore trigger error
                } else if (err.errorNum === 2289) {
                    // sequence doesn't exist
                } else if (err.errorNum === 1) { // unique constraint on insert
                } else {
                    console.error("Error executing:", sql.substring(0, 50));
                    console.error(err.message);
                }
            }
        }
        await connection.commit();
        console.log("Database initialized successfully!");
    } catch (err) {
        console.error("Initialization Failed:", err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}
run();
