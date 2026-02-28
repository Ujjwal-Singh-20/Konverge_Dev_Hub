/**
 * src/services/roomService.js — Room Business Logic
 *
 * All Firestore operations related to rooms: creating, joining, and listing.
 * The creator is always included in allowedEmails automatically.
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/firebase');

/**
 * Creates a new room in Firestore.
 * @param {string} name         - Display name of the room.
 * @param {string} creatorEmail - Email of the user creating the room.
 * @param {string[]} allowedEmails - List of emails permitted to join.
 * @returns {object} The created room document.
 */
async function createRoom(name, creatorEmail, allowedEmails = []) {
    const db = getDb();

    // Always include creator in allowed list
    const emails = Array.from(new Set([creatorEmail, ...allowedEmails]));

    const roomId = uuidv4();
    const roomData = {
        name,
        creatorEmail,
        allowedEmails: emails,
        participants: [creatorEmail],
        createdAt: new Date().toISOString(),
    };

    await db.collection('rooms').doc(roomId).set(roomData);

    return { id: roomId, ...roomData };
}

/**
 * Joins an existing room. The user must be in allowedEmails.
 * Adds the user to the participants array (idempotent via arrayUnion).
 * @param {string} roomId - Firestore room document ID.
 * @param {string} email  - Email of the joining user.
 * @returns {object} Updated room document.
 */
async function joinRoom(roomId, email) {
    const db = getDb();
    const roomRef = db.collection('rooms').doc(roomId);
    const snap = await roomRef.get();

    if (!snap.exists) throw Object.assign(new Error('Room not found'), { status: 404 });

    const room = snap.data();
    if (!room.allowedEmails.includes(email)) {
        throw Object.assign(new Error('You are not allowed into this room'), { status: 403 });
    }

    // Use arrayUnion so duplicate entries are never created
    await roomRef.update({
        participants: require('firebase-admin').firestore.FieldValue.arrayUnion(email),
    });

    const updated = await roomRef.get();
    return { id: roomId, ...updated.data() };
}

/**
 * Lists all rooms the requesting user's email appears in (as allowed or participant).
 * @param {string} email - The caller's email.
 * @returns {object[]} Array of room objects.
 */
async function listRooms(email) {
    const db = getDb();

    // Firestore array-contains query
    const snap = await db.collection('rooms')
        .where('allowedEmails', 'array-contains', email)
        .orderBy('createdAt', 'desc')
        .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

module.exports = { createRoom, joinRoom, listRooms };
