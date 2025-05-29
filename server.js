import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:4943', 'https://gc7jb-aiaaa-aaaaf-qap7a-cai.icp0.io'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', port: PORT });
});

app.post('/analyze', async (req, res) => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'imageBase64 is required' });
        }

        console.log('Analyzing image...');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4.1',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this waste image and suggest 3 creative DIY projects that can be made from these materials. For each project, provide: 1) Project name, 2) Brief description, 3) Materials needed, 4) Step-by-step instructions. Return ONLY a JSON array with these fields: name, description, materials, instructions. Do not include any markdown formatting or code blocks.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error:', errorData);
            return res.status(response.status).json({ 
                error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}` 
            });
        }

        const data = await response.json();
        console.log('Analysis successful');
        res.json(data);
    } catch (error) {
        console.error('Analyze endpoint error:', error);
        res.status(500).json({ error: 'Failed to analyze image: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});