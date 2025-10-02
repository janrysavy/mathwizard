const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const server = http.createServer((req, res) => {
    const clientIP = req.socket.remoteAddress;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

    // Remove query string from URL (e.g. /game.js?v=3.3.3 -> /game.js)
    const urlPath = req.url.split('?')[0];

    let filePath = '.' + urlPath;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`[${timestamp}] ❌ 404 | ${clientIP} | ${req.url} -> ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                console.log(`[${timestamp}] ⚠️  500 | ${clientIP} | ${req.url} | ${error.code}`);
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            const sizeKB = (content.length / 1024).toFixed(2);
            console.log(`[${timestamp}] ✅ 200 | ${clientIP} | ${req.url} -> ${filePath} | ${sizeKB} KB`);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log('\n🎮 Math Wizard Game Server');
    console.log('════════════════════════════════════════');
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://${localIP}:${PORT}`);
    console.log('════════════════════════════════════════');
    console.log('\n📱 On iPhone/iPad open:');
    console.log(`   http://${localIP}:${PORT}`);
    console.log('\n⚠️  Make sure both devices are on the same WiFi network\n');
    console.log('Press Ctrl+C to stop the server\n');
});
