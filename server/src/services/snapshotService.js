/**
 * src/services/snapshotService.js — Version History (Firestore)
 *
 * Snapshots live at:
 *   rooms/{roomId}/files/{fileId}/snapshots/{snapId}
 *
 * Supports:
 *   - Manual save (user-triggered with commit message)
 *   - List all versions
 *   - Rollback to any previous version
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/firebase');

/**
 * Save a manual snapshot of a file.
 */
async function saveSnapshot(roomId, fileId, savedBy, commitMessage = 'manual save') {
    const db = getDb();
    const fileRef = db.collection('rooms').doc(roomId).collection('files').doc(fileId);
    const fileSnap = await fileRef.get();

    if (!fileSnap.exists) throw Object.assign(new Error('File not found'), { status: 404 });

    const snapId = uuidv4();
    const snapshotData = {
        content: fileSnap.data().content,
        savedBy,
        commitMessage,
        createdAt: new Date().toISOString(),
    };

    await fileRef.collection('snapshots').doc(snapId).set(snapshotData);
    return { id: snapId, ...snapshotData };
}

/**
 * List all snapshots for a file, newest first.
 */
async function listSnapshots(roomId, fileId) {
    const db = getDb();
    const snap = await db.collection('rooms').doc(roomId)
        .collection('files').doc(fileId)
        .collection('snapshots')
        .orderBy('createdAt', 'desc')
        .get();

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Rollback a file to a specific snapshot.
 * Saves the current state as a snapshot first (so rollback is reversible).
 *
 * @param {string} roomId
 * @param {string} fileId
 * @param {string} snapshotId - The snapshot to restore.
 * @param {string} rolledBackBy - Email performing the rollback.
 */
async function rollbackToSnapshot(roomId, fileId, snapshotId, rolledBackBy) {
    const db = getDb();
    const fileRef = db.collection('rooms').doc(roomId).collection('files').doc(fileId);
    const snapRef = fileRef.collection('snapshots').doc(snapshotId);

    const [fileSnap, targetSnap] = await Promise.all([fileRef.get(), snapRef.get()]);

    if (!fileSnap.exists) throw Object.assign(new Error('File not found'), { status: 404 });
    if (!targetSnap.exists) throw Object.assign(new Error('Snapshot not found'), { status: 404 });

    const now = new Date().toISOString();

    // Preserve current state before rolling back
    await fileRef.collection('snapshots').doc(uuidv4()).set({
        content: fileSnap.data().content,
        savedBy: rolledBackBy,
        commitMessage: `auto-save before rollback to ${snapshotId}`,
        createdAt: now,
    });

    const restoredContent = targetSnap.data().content;
    await fileRef.update({ content: restoredContent, updatedAt: now });

    return { id: fileId, content: restoredContent, updatedAt: now, rolledBackTo: snapshotId };
}

module.exports = { saveSnapshot, listSnapshots, rollbackToSnapshot };
