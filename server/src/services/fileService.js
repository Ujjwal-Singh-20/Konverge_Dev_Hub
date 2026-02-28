/**
 * src/services/fileService.js — File Management (Firestore)
 *
 * Files are stored as subcollections under each room:
 *   rooms/{roomId}/files/{fileId}
 *
 * On every content update, a snapshot is auto-saved to:
 *   rooms/{roomId}/files/{fileId}/snapshots/{snapId}
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/firebase');

/**
 * List all files in a room.
 */
async function listFiles(roomId) {
    const db = getDb();
    const snap = await db.collection('rooms').doc(roomId)
        .collection('files').orderBy('createdAt', 'asc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Create a new file in a room.
 * @param {string} roomId
 * @param {string} filename  - e.g. "index.js"
 * @param {string} language  - Monaco language id e.g. "javascript"
 * @param {string} content   - Initial file content
 * @param {string} createdBy - Email of creator
 */
async function createFile(roomId, filename, language = 'javascript', content = '', createdBy) {
    const db = getDb();
    const fileId = uuidv4();
    const now = new Date().toISOString();

    const fileData = { roomId, filename, language, content, createdBy, createdAt: now, updatedAt: now };
    await db.collection('rooms').doc(roomId).collection('files').doc(fileId).set(fileData);

    return { id: fileId, ...fileData };
}

/**
 * Get a single file's content.
 */
async function getFile(roomId, fileId) {
    const db = getDb();
    const snap = await db.collection('rooms').doc(roomId).collection('files').doc(fileId).get();
    if (!snap.exists) throw Object.assign(new Error('File not found'), { status: 404 });
    return { id: snap.id, ...snap.data() };
}

/**
 * Update file content.
 * Automatically saves a snapshot before overwriting.
 * @param {string} roomId
 * @param {string} fileId
 * @param {string} content   - New content
 * @param {string} updatedBy - Email of editor
 */
async function updateFile(roomId, fileId, content, updatedBy) {
    const db = getDb();
    const fileRef = db.collection('rooms').doc(roomId).collection('files').doc(fileId);
    const snap = await fileRef.get();
    if (!snap.exists) throw Object.assign(new Error('File not found'), { status: 404 });

    const now = new Date().toISOString();

    // Auto-snapshot: preserve previous content before overwriting
    const prevContent = snap.data().content;
    if (prevContent !== content) {
        const snapId = uuidv4();
        await fileRef.collection('snapshots').doc(snapId).set({
            content: prevContent,
            savedBy: updatedBy,
            commitMessage: 'auto-save before edit',
            createdAt: now,
        });
    }

    await fileRef.update({ content, updatedAt: now });
    return { id: fileId, content, updatedAt: now };
}

/**
 * Delete a file and all its snapshots.
 */
async function deleteFile(roomId, fileId) {
    const db = getDb();
    const fileRef = db.collection('rooms').doc(roomId).collection('files').doc(fileId);

    // Delete subcollection snapshots first
    const snaps = await fileRef.collection('snapshots').get();
    const batch = db.batch();
    snaps.docs.forEach(d => batch.delete(d.ref));
    batch.delete(fileRef);
    await batch.commit();
}

module.exports = { listFiles, createFile, getFile, updateFile, deleteFile };
