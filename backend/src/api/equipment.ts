import { Router } from 'express';
import db from '../db';

const router = Router();

// GET all equipment
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM equipment ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST new equipment
router.post('/', async (req, res) => {
    const { name, description, imageUrl } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO equipment (name, description, "imageUrl") VALUES ($1, $2, $3) RETURNING *',
            [name, description, imageUrl]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT to update equipment
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, imageUrl } = req.body;
    try {
        const { rows } = await db.query(
            'UPDATE equipment SET name = $1, description = $2, "imageUrl" = $3 WHERE id = $4 RETURNING *',
            [name, description, imageUrl, id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE equipment
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM equipment WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
