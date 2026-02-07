import Fastify from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios'; 
import { WebSocketServer } from 'ws';

// Load keys
dotenv.config();
const { GOOGLE_API_KEY, ELEVENLABS_API_KEY, PORT } = process.env;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" }
}); 

// Initialize Fastify
const fastify = Fastify();
fastify.register(fastifyFormBody);

const NGROK_URL = "aleen-hypoglycemic-palynologically.ngrok-free.dev"; 

// SESSION TRACKING
let conversationLog = "";

// Root Route
fastify.get('/', async (request, reply) => {
    reply.send({ message: 'Twilio 911 AI Server Running!' });
});

// Incoming Call Route
fastify.all('/incoming-call', async (request, reply) => {
    conversationLog = ""; // Reset history
    const streamUrl = `wss://${NGROK_URL}/media-stream`;
    console.log(`📞 New Call! Connecting to: ${streamUrl}`);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say>911, What is your emergency?</Say>
        <Connect>
            <Stream url="${streamUrl}" />
        </Connect>
    </Response>`;

    reply.type('text/xml').send(twiml);
});

// --- START SERVER ---
const start = async () => {
    try {
        const port = PORT || 5000;
        await fastify.listen({ port: port, host: '0.0.0.0' });
        console.log(`🚀 Server listening on port ${port}`);

        const wss = new WebSocketServer({ server: fastify.server });

        wss.on('connection', (ws) => {
            console.log('✅ Twilio Stream Connected');

            let streamSid = null;
            let audioBuffer = [];
            let silentChunks = 0;
            let isProcessing = false;
            let callActive = true; // <--- NEW: Master Switch

            // --- TUNING SETTINGS ---
            const SILENCE_THRESHOLD = 200; 
            const SILENCE_DURATION = 250; // 5 Seconds

            ws.on('message', async (message) => {
                if (!callActive) return; // <--- STOP LISTENING IF CALL IS DONE

                try {
                    const data = JSON.parse(message.toString());

                    if (data.event === 'start') {
                        streamSid = data.start.streamSid;
                    } 
                    else if (data.event === 'media') {
                        if (isProcessing) return;

                        const chunk = Buffer.from(data.media.payload, 'base64');
                        audioBuffer.push(chunk);

                        if (audioBuffer.length > 500) audioBuffer.shift(); 

                        const energy = chunk.reduce((acc, byte) => acc + Math.abs(byte - 128), 0) / chunk.length;

                        if (energy > SILENCE_THRESHOLD) {
                            silentChunks = 0; 
                        } else {
                            silentChunks++;   
                        }

                        if (silentChunks > SILENCE_DURATION && audioBuffer.length > 20) {
                            console.log('🗣️ User silence detected. Processing turn...');
                            
                            isProcessing = true;
                            const completeAudio = Buffer.concat(audioBuffer);
                            audioBuffer = [];
                            silentChunks = 0;

                            // Process the audio and check if we should end the call
                            const shouldEnd = await processAudio(completeAudio, ws, streamSid);
                            
                            if (shouldEnd) {
                                callActive = false; // Kill the mic
                                console.log("🛑 CALL COMPLETE. IGNORING FURTHER AUDIO.");
                            }
                            
                            isProcessing = false;
                        }
                    }
                    else if (data.event === 'stop') {
                        console.log('🛑 Stream Stopped');
                    }
                } catch (error) {
                    console.error('❌ WS Message Error:', error);
                }
            });

            ws.on('close', () => console.log('❌ Client Disconnected'));
        });

    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// --- AI PROCESSING ---

async function processAudio(audioData, ws, streamSid) {
    try {
        const wavHeader = createWavHeader(audioData.length);
        const wavBuffer = Buffer.concat([wavHeader, audioData]);
        const base64Audio = wavBuffer.toString('base64');

        // --- FINAL LOOP FIX PROMPT ---
        const systemPrompt = `
            You are a 911 Emergency Dispatcher.
            Your manner must be: Calm, Authoritative, and Concise.

            CURRENT CONVERSATION HISTORY:
            ${conversationLog}

            INSTRUCTIONS:
            1. Analyze the user's input to determine the Scenario.
            2. Follow the strictly defined Checklist for that scenario.
            3. Ask ONE question at a time.
            
            **TERMINATION PROTOCOL (CRITICAL):**
            - If you have gathered the Location and Nature of the emergency, ask: "Is there any other information I should know?"
            - If the user says "No", "That's it", or "Nope" to that question:
                - REPLY: "Okay, help is on the way. Stay on the line."
                - SET 'is_final': true
            
            --- SCENARIO CHECKLISTS ---

            [SCENARIO A: ROBBERY]
            Checklist: Location -> Time -> Description
            
            [SCENARIO B: MEDICAL]
            Checklist: Location -> Symptoms -> Patient Info

            [SCENARIO C: KIDNAPPING]
            Checklist: Location -> Time -> Suspect/Vehicle Info

            --- OUTPUT FORMAT ---
            Return a JSON object:
            {
              "transcript": "Exact words the user said",
              "scenario_detected": "ROBBERY | MEDICAL | KIDNAPPING | GENERAL",
              "reply": "Your response",
              "is_final": boolean (true ONLY if you are saying goodbye/dispatching)
            }
        `;

        const result = await model.generateContent([
            systemPrompt,
            {
                inlineData: {
                    mimeType: "audio/wav",
                    data: base64Audio
                }
            }
        ]);

        const responseText = result.response.text();
        const responseJson = JSON.parse(responseText); 

        // Update History
        conversationLog += `\nUser: ${responseJson.transcript}\nDispatcher: ${responseJson.reply}`;

        console.log(`🎤 USER: "${responseJson.transcript}"`);
        console.log(`🚨 SCENARIO: [${responseJson.scenario_detected}]`);
        console.log(`🤖 REPLY: "${responseJson.reply}"`);
        
        // --- TTS via ElevenLabs ---
        const voiceId = "JBFqnCBsd6RMkjVDRZzb"; 
        
        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=ulaw_8000`,
            headers: { 
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            data: {
                text: responseJson.reply, 
                model_id: "eleven_turbo_v2"
            },
            responseType: 'stream'
        });

        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ event: 'clear', streamSid }));
        }

        let isFirstChunk = true;
        const stream = response.data;

        stream.on('data', (chunk) => {
            let dataToSend = chunk;
            if (isFirstChunk) {
                isFirstChunk = false;
                if (chunk.length >= 44 && chunk[0] === 0x52 && chunk[1] === 0x49) {
                    dataToSend = chunk.subarray(44);
                }
            }
            const mediaMessage = {
                event: 'media',
                streamSid: streamSid,
                media: { 
                    payload: dataToSend.toString('base64'),
                    track: 'outbound'
                }
            };
            if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(mediaMessage));
        });

        // RETURN THE SIGNAL TO KILL THE CALL
        if (responseJson.is_final) {
            console.log("🏁 DISPATCH SENT. ENDING SESSION.");
            return true; // Tells the main loop to stop listening
        }
        return false;

    } catch (error) {
        console.error("❌ ERROR IN AI PIPELINE:", error.message);
        return false;
    }
}

function createWavHeader(dataLength) {
    const buffer = Buffer.alloc(44);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(7, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(8000, 24);
    buffer.writeUInt32LE(8000, 28);
    buffer.writeUInt16LE(1, 32);
    buffer.writeUInt16LE(8, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    return buffer;
}

start();