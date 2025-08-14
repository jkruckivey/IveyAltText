const OpenAI = require('openai');
const fs = require('fs');

/**
 * Fine-tuning script for OpenAI models
 * This creates a custom model trained on your specific alt text examples
 */

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Example training data format
const trainingExamples = [
    {
        "messages": [
            {
                "role": "system", 
                "content": "You are an expert at creating concise, descriptive alt text for web accessibility. Focus on the most important visual elements that help users understand the image content and context."
            },
            {
                "role": "user", 
                "content": "Generate alt text for this image: [Image of a woman in business attire presenting to colleagues]"
            },
            {
                "role": "assistant", 
                "content": "Professional woman giving presentation to colleagues in modern conference room"
            }
        ]
    },
    // Add more training examples...
];

async function createFineTunedModel() {
    try {
        // 1. Prepare training data file
        const trainingData = trainingExamples.map(example => 
            JSON.stringify(example)
        ).join('\n');
        
        fs.writeFileSync('training-data.jsonl', trainingData);

        // 2. Upload training file
        const file = await openai.files.create({
            file: fs.createReadStream('training-data.jsonl'),
            purpose: 'fine-tune',
        });

        console.log('Training file uploaded:', file.id);

        // 3. Create fine-tuning job
        const fineTune = await openai.fineTuning.jobs.create({
            training_file: file.id,
            model: 'gpt-3.5-turbo',
            hyperparameters: {
                n_epochs: 3,
                batch_size: 1,
                learning_rate_multiplier: 0.1
            }
        });

        console.log('Fine-tuning job created:', fineTune.id);
        return fineTune.id;

    } catch (error) {
        console.error('Fine-tuning error:', error);
    }
}

// Monitor fine-tuning progress
async function checkFineTuningStatus(jobId) {
    const status = await openai.fineTuning.jobs.retrieve(jobId);
    console.log('Status:', status.status);
    
    if (status.status === 'succeeded') {
        console.log('Fine-tuned model ID:', status.fine_tuned_model);
        return status.fine_tuned_model;
    }
    
    return null;
}

module.exports = { createFineTunedModel, checkFineTuningStatus };