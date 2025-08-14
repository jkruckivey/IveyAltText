/**
 * Feedback Collection System
 * Collects user feedback on AI-generated alt text for continuous improvement
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Database simulation (in production, use a real database)
const FEEDBACK_FILE = 'feedback-data.json';

// Initialize feedback data structure
async function initializeFeedbackData() {
    try {
        await fs.access(FEEDBACK_FILE);
    } catch {
        await fs.writeFile(FEEDBACK_FILE, JSON.stringify([], null, 2));
    }
}

// Save feedback data
async function saveFeedback(feedbackData) {
    try {
        const existingData = JSON.parse(await fs.readFile(FEEDBACK_FILE, 'utf8'));
        existingData.push({
            ...feedbackData,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
        });
        await fs.writeFile(FEEDBACK_FILE, JSON.stringify(existingData, null, 2));
    } catch (error) {
        console.error('Error saving feedback:', error);
        throw error;
    }
}

// Get feedback analytics
async function getFeedbackAnalytics() {
    try {
        const data = JSON.parse(await fs.readFile(FEEDBACK_FILE, 'utf8'));
        
        const analytics = {
            totalFeedback: data.length,
            averageRating: data.reduce((sum, item) => sum + (item.rating || 0), 0) / data.length || 0,
            ratingDistribution: {
                1: data.filter(item => item.rating === 1).length,
                2: data.filter(item => item.rating === 2).length,
                3: data.filter(item => item.rating === 3).length,
                4: data.filter(item => item.rating === 4).length,
                5: data.filter(item => item.rating === 5).length,
            },
            commonImprovements: data
                .filter(item => item.userImprovement)
                .map(item => item.userImprovement),
            recentFeedback: data.slice(-10).reverse()
        };
        
        return analytics;
    } catch (error) {
        return { totalFeedback: 0, averageRating: 0 };
    }
}

// Generate training data from feedback
async function generateTrainingDataFromFeedback() {
    try {
        const data = JSON.parse(await fs.readFile(FEEDBACK_FILE, 'utf8'));
        
        const trainingExamples = data
            .filter(item => item.rating >= 4 || item.userImprovement) // Only use good feedback
            .map(item => ({
                messages: [
                    {
                        role: "system",
                        content: "Generate concise, descriptive alt text for web accessibility. Focus on the most important visual elements."
                    },
                    {
                        role: "user",
                        content: `Generate alt text for this image type: ${item.imageType || 'general image'}`
                    },
                    {
                        role: "assistant",
                        content: item.userImprovement || item.generatedAltText
                    }
                ]
            }));
        
        await fs.writeFile('training-data-from-feedback.jsonl', 
            trainingExamples.map(ex => JSON.stringify(ex)).join('\n'));
        
        return trainingExamples.length;
    } catch (error) {
        console.error('Error generating training data:', error);
        return 0;
    }
}

// API Routes for feedback system
function setupFeedbackRoutes(app) {
    // Submit feedback
    app.post('/api/feedback', async (req, res) => {
        try {
            const { 
                generatedAltText, 
                userImprovement, 
                rating, 
                imageType, 
                helpful 
            } = req.body;
            
            await saveFeedback({
                generatedAltText,
                userImprovement,
                rating: parseInt(rating),
                imageType,
                helpful: Boolean(helpful)
            });
            
            res.json({ success: true, message: 'Feedback saved successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to save feedback' });
        }
    });
    
    // Get feedback analytics (admin route)
    app.get('/api/admin/analytics', async (req, res) => {
        try {
            const analytics = await getFeedbackAnalytics();
            res.json(analytics);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get analytics' });
        }
    });
    
    // Generate training data (admin route)
    app.post('/api/admin/generate-training-data', async (req, res) => {
        try {
            const count = await generateTrainingDataFromFeedback();
            res.json({ 
                success: true, 
                message: `Generated ${count} training examples`,
                count 
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to generate training data' });
        }
    });
}

// Initialize on startup
initializeFeedbackData();

module.exports = { 
    setupFeedbackRoutes, 
    saveFeedback, 
    getFeedbackAnalytics,
    generateTrainingDataFromFeedback
};