const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { setupFeedbackRoutes } = require('./feedback-system');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to generate alt text
app.post('/api/generate-alt-text', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        
        let altText;
        
        // Check if OpenAI API key is available
        if (process.env.OPENAI_API_KEY) {
            altText = await generateAltTextWithOpenAI(base64Image, mimeType);
        } else {
            // Fallback to mock generation for demo purposes
            altText = await generateMockAltText();
        }

        res.json({ altText });
    } catch (error) {
        console.error('Error generating alt text:', error);
        res.status(500).json({ 
            error: 'Failed to generate alt text. Please try again.' 
        });
    }
});

// OpenAI integration
async function generateAltTextWithOpenAI(base64Image, mimeType) {
    const OpenAI = require('openai');
    
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Generate a concise, descriptive alt text for this image. Focus on the main subject, important details, and context that would help someone who cannot see the image understand what it shows. Keep it under 125 characters when possible."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 150
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error('Failed to generate alt text using OpenAI');
    }
}

// Mock alt text generation for demo
async function generateMockAltText() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResponses = [
        "A person working on a laptop computer in a bright, modern office space",
        "Beautiful sunset landscape with mountains and colorful sky in the background",
        "Close-up portrait of a happy golden retriever dog sitting outdoors on grass",
        "Modern kitchen interior with white cabinets and stainless steel appliances",
        "Group of friends enjoying dinner together at a restaurant table",
        "Serene mountain lake surrounded by pine trees under a clear blue sky",
        "Vintage red bicycle leaning against a brick wall covered with green ivy",
        "Professional woman giving a business presentation to colleagues in conference room",
        "Fresh vegetables and fruits arranged colorfully on a wooden cutting board",
        "Cozy living room with comfortable sofa, plants, and warm lighting"
    ];
    
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

// Setup feedback routes
setupFeedbackRoutes(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        hasOpenAI: !!process.env.OPENAI_API_KEY
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to view the application`);
    console.log(`OpenAI integration: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled (using mock responses)'}`);
});