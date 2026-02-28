/**
 * src/services/aiService.js — AI Query & Diff Generation
 *
 * Flow:
 *   1. Decrypt the user's LLM API token from Firestore.
 *   2. Fetch current room file(s) from Firestore as code context.
 *   3. Build a prompt combining the code + user question.
 *   4. Call the LLM API (OpenAI-compatible endpoint).
 *   5. Compute a unified diff between old code and AI suggestion.
 *   6. Return { answer, code, diff }.
 *
 * The user's token is never logged.
 */

const { getLlmToken } = require('./userService');
const { getFile } = require('./fileService');
const Diff = require('diff');

/**
 * Query the AI with a code context.
 *
 * @param {string} userEmail
 * @param {string} roomId
 * @param {string} fileId     - Active file ID
 * @param {string} question   - User's natural language question
 * @returns {{ answer: string, code: string|null, diff: string|null }}
 */
async function queryAi(userEmail, roomId, fileId, question) {
    // 1. Retrieve user's LLM token (decrypted in memory, never logged)
    const llmToken = await getLlmToken(userEmail);
    if (!llmToken) {
        throw Object.assign(new Error('No LLM API token saved. Add your token in settings.'), { status: 400 });
    }

    // 2. Fetch current file content for context injection
    let fileContent = '';
    let filename = '';
    let language = '';
    try {
        const file = await getFile(roomId, fileId);
        fileContent = file.content;
        filename = file.filename;
        language = file.language || '';
    } catch {
        // Not fatal — proceed without code context
    }

    // 3. Build prompt
    const systemPrompt =
        `You are an expert developer assistant embedded in the Konverge collaborative code editor.\n` +
        `When you suggest code changes, you MUST prepend your response with either [TYPE:NEW] (if the code is completely new) or [TYPE:UPDATED] (if you are returning a modified version of the existing file).\n` +
        `CRITICAL INSTRUCTION: If the type is [TYPE:UPDATED], you MUST return the ENTIRE modified file content, start to finish. DO NOT return just a snippet or fragment, otherwise the diff viewer will delete the rest of the user's file. If the type is [TYPE:NEW], just return the new snippet.\n` +
        `ALWAYS wrap your code block (the full file or the new snippet) inside triple backticks (e.g. \`\`\`javascript) OR a <code> tag.\n` +
        `Be concise, professional, and focused.`;

    const userMessage = fileContent
        ? `File: ${filename}\nLanguage: ${language || 'unknown'}\n\`\`\`${language}\n${fileContent}\n\`\`\`\n\nQuestion: ${question}`
        : question;

    // 4. Call LLM API (Gemini REST API)
    // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${llmToken}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${llmToken}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: systemPrompt + '\n\n' + userMessage }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
            }
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw Object.assign(new Error(`Gemini API error: ${errText}`), { status: response.status });
    }

    const data = await response.json();
    const rawAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 5. Extract suggested code block and type flag
    let suggestedCode = null;
    const codeMatch = rawAnswer.match(/<code>([\s\S]*?)<\/code>/i);
    if (codeMatch) {
        suggestedCode = codeMatch[1].trim();
    } else {
        const mdMatch = rawAnswer.match(/```[a-z]*\n([\s\S]*?)```/i);
        if (mdMatch) {
            suggestedCode = mdMatch[1].trim();
        }
    }

    let type = 'new';
    if (rawAnswer.includes('[TYPE:UPDATED]')) type = 'updated';
    else if (rawAnswer.includes('[TYPE:NEW]')) type = 'new';
    else if (fileContent) type = 'updated'; // Fallback heuristic

    // 6. Compute unified diff if we have both original and suggested code
    let diffPatch = null;
    if (suggestedCode && fileContent) {
        diffPatch = Diff.createPatch(filename, fileContent, suggestedCode, 'current', 'ai-suggestion');
    }

    // Strip tags and flags from the visible answer
    const answer = rawAnswer
        .replace(/<code>[\s\S]*?<\/code>/gi, '')
        .replace(/```[a-z]*\n[\s\S]*?```/gi, '')
        .replace(/\[TYPE:NEW\]/gi, '')
        .replace(/\[TYPE:UPDATED\]/gi, '')
        .trim();

    return { answer, code: suggestedCode, diff: diffPatch, type };
}

module.exports = { queryAi };
