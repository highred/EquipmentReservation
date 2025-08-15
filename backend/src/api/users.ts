import { Router } from 'express';
import db from '../db';

const router = Router();

// GET all users
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM users ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST a new user
router.post('/', async (req, res) => {
    const { name, role } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO users (name, role) VALUES ($1, $2) RETURNING *',
            [name, role]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT to update a user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, role } = req.body;
    try {
        const { rows } = await db.query(
            'UPDATE users SET name = $1, role = $2 WHERE id = $3 RETURNING *',
            [name, role, id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE a user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.status(204).send(); // No Content
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
