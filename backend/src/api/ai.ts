import { Router } from 'express';
import { callGemini, getRescheduleSuggestions } from '../services/geminiService';

const router = Router();

router.post('/schedule', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
        const result = await callGemini(prompt);
        res.json(result);
    } catch (error) {
        console.error("Error in AI scheduling endpoint:", error);
        res.status(500).json({ error: (error as Error).message || 'Failed to get a response from the AI assistant.' });
    }
});


router.post('/reschedule', async (req, res) => {
    const { equipmentId, start, end, jobDescription, userId } = req.body;
    
    if (!equipmentId || !start || !end || !jobDescription || !userId) {
        return res.status(400).json({ error: 'Missing required fields for rescheduling.' });
    }

    try {
        const result = await getRescheduleSuggestions({ equipmentId, start, end, jobDescription, userId });
        res.json(result);
    } catch (error) {
        console.error("Error in AI rescheduling endpoint:", error);
        res.status(500).json({ error: (error as Error).message || 'Failed to get rescheduling suggestions from the AI assistant.' });
    }
});


export default router;