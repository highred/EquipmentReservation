import { Router } from 'express';
import db from '../db';

const router = Router();

// GET all reservations
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM reservations ORDER BY start DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST a new reservation
router.post('/', async (req, res) => {
    const { equipmentId, userId, jobDescription, start, end } = req.body;

    // Server-side validation for double-booking
    try {
        const { rows: conflictingReservations } = await db.query(
            `SELECT * FROM reservations 
             WHERE "equipmentId" = $1 AND (start, "end") OVERLAPS ($2, $3)`,
            [equipmentId, start, end]
        );

        if (conflictingReservations.length > 0) {
            return res.status(409).json({ error: 'This equipment is already booked for the selected time.' });
        }

        const { rows } = await db.query(
            'INSERT INTO reservations ("equipmentId", "userId", "jobDescription", start, "end") VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [equipmentId, userId, jobDescription, start, end]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE a reservation
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM reservations WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
