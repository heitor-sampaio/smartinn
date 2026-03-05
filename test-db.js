const { Client } = require('pg');

const fs = require('fs');
async function testConnection() {
    const envFile = fs.readFileSync('.env', 'utf8');
    const directUrl = envFile.match(/DIRECT_URL="(.*)"/)[1];
    console.log("Testing DIRECT_URL connection to:", directUrl.replace(/:([^:@]+)@/, ':***@'));

    const client = new Client({
        connectionString: directUrl,
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log("Success! Connected to DIRECT_URL.");
        await client.end();
    } catch (err) {
        console.error("Connection error with DIRECT_URL:", err.message);
    }
}

testConnection();
