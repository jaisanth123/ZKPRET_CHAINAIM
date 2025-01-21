import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { regexCircuit } from './src/circuitGen.js';

const execPromise = promisify(exec); // Promisify exec for better async handling

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace useState with a regular variable
let result = ''; // Manage state server-side without React hooks
let ExpectedRegex = '';
let ActualRegex = '';

const port = 4000;

// Initialize Express app
const app = express();
app.use(cors()); // Enable cross-origin requests

// Multer configuration for file upload
const upload = multer({ dest: 'uploads/' });

// Create HTTP server for Express
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected via WebSocket');
    ws.on('message', (message) => {
        console.log(`Received WebSocket message: ${message}`);
    });
});

// Route to upload the BPMN file and process it
app.post('/api/upload/expected', upload.single('bpmnFile'), async (req, res) => {
    try {
        console.log("expected======================================")
        const filePath = req.file.path;  
        await expectedEndpoint(filePath);
        res.json({ ExpectedRegex });
    } catch (err) {
        return res.status(500).send(`Internal server error: ${err}`);
    }
});

app.get('/api/verify-bpmn', async (req, res) => {
    try {
        await verifyBpmn(); // Ensure verifyBpmn() is executed to update the `result`
        res.json({ isVerified: result }); // Send the boolean result as JSON
    } catch (err) {
        console.error('Error verifying BPMN:', err);
        res.status(500).json({ error: 'Failed to verify BPMN' });
    }
});

// Route to upload the actual BPMN file and process it
app.post('/api/upload/actual', upload.single('bpmnFile'), async (req, res) => {
    console.log("actual======================================");
    try {
        const filePath = req.file.path;
        await actualEndpoint(filePath);
        res.json({ ActualRegex });
        verifyBpmn();
    } catch (err) {
        return res.status(500).send(`Internal server error: ${err}`);
    }
});

// Start the Express server and WebSocket server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Parsing functions
async function parseExpectedRegex(filePath) {
    return new Promise((resolve, reject) => {
        exec(`python parse_bpmn.py ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`Python stderr: ${stderr}`);
                return reject(new Error(stderr));
            }
            const ExpectedcombinedExpression = stdout.trim();
            console.log('Expected Combined Expression:', ExpectedcombinedExpression);
            ExpectedRegex = ExpectedcombinedExpression;
            resolve();
        });
    });
}

async function parseActualRegex(filePath) {
    return new Promise((resolve, reject) => {
        exec(`python parse_bpmn.py ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`Python stderr: ${stderr}`);
                return reject(new Error(stderr));
            }
            const ActualcombinedExpression = stdout.trim();
            console.log('Actual Combined Expression:', ActualcombinedExpression);
            ActualRegex = ActualcombinedExpression;
            resolve();
        });
    });
}

// Endpoint processing functions
async function expectedEndpoint(filePath) {
    await parseExpectedRegex(filePath);
    console.log("fileParsed");
    await regexCircuit(ExpectedRegex);
    console.log("expectedregex parsed successfully");
}

async function actualEndpoint(filePath) {
    await parseActualRegex(filePath);
    console.log("actualregex parsed successfully");
}

async function verifyBpmn() {
    await buildFiles();
    await executeMain();
    console.log("verify bpmn function");
}

// TypeScript and Main.js execution
async function buildFiles() {
    try {
        console.log('Starting TypeScript compilation...');
        const { stdout: tscOutput } = await execPromise('npx tsc');
        console.log('TypeScript compilation output:', tscOutput);
    } catch (error) {
        console.error('Error during TSC or script execution:', error.message);
    }
}

async function executeMain() {
    try {
        console.log('Running main.js...');
        const { stdout: mainJsOutput } = await execPromise(`node build/main.js "${ExpectedRegex}" "${ActualRegex}"`);
        console.log('main.js output:', mainJsOutput);
        const match = mainJsOutput.match(/Final boolean result:\s*(true|false)/);
        result = match ? match[1] : '';
        console.log('Boolean result fetched from main.js:', result);
    } catch (error) {
        console.error('Error during TSC or script execution:', error.message);
    }
}
