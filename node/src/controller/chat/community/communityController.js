const db = require("../../../config/db");


// diplay all messages logic
const getAllMessages = async (req, res) => {
    try {
        const [rows] = await db.query(
            `   SELECT 
                c.message_id, 
                c.message_text AS message, 
                c.memberQid, 
                u.username
                FROM community c
                JOIN users u ON c.memberQid = u.memberQid
                WHERE c.deleted_at IS NULL
                ORDER BY c.created_at ASC
            `
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const memberQid = req.user.memberQid; // from JWT decode
        const { message } = req.body;
        const [result] = await db.query(
            "INSERT INTO community (memberQid, message_text) VALUES (?, ?)",
            [memberQid, message]
        );

        const msgObj = { message_id: result.insertId, memberQid, message };
        res.json(msgObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const editMessage = async (req, res) => {
    try {
        const memberQid = req.user.memberQid;
        const { message_id, newText } = req.body;

        const [rows] = await db.query(
            "SELECT memberQid FROM community WHERE message_id = ? AND deleted_at IS NULL",
            [message_id]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Message not found" });
        if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized" });

        await db.query(
            "UPDATE community SET message_text = ?, updated_at = NOW() WHERE message_id = ?",
            [newText, message_id]
        );

        res.json({ message_id, newText });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const memberQid = req.user.memberQid;
        const { message_id } = req.body;

        const [rows] = await db.query(
            "SELECT memberQid FROM community WHERE message_id = ? AND deleted_at IS NULL",
            [message_id]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Message not found" });
        if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized" });

        await db.query(
            "UPDATE community SET deleted_at = NOW() WHERE message_id = ?",
            [message_id]
        );

        res.json({ message_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllMessages,
    sendMessage,
    editMessage,
    deleteMessage
};