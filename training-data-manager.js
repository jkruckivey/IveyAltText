/**
 * Training Data Management System
 * Handles collection, preparation, and fine-tuning of alt-text generation models
 */

const fs = require('fs').promises;
const OpenAI = require('openai');

class TrainingDataManager {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.trainingFile = 'training-examples.jsonl';
        this.fineTunedModel = null;
    }

    // Initial high-quality training examples
    getBaseTrainingData() {
        return [
            {
                messages: [
                    {
                        role: "system",
                        content: "Generate concise, descriptive alt text for web accessibility. Focus on the main subject, important details, and context that would help someone who cannot see the image understand what it shows. Keep it under 125 characters when possible."
                    },
                    {
                        role: "user", 
                        content: "Generate alt text for an image showing a person working on a laptop in a modern office space with large windows and plants"
                    },
                    {
                        role: "assistant",
                        content: "Person typing on laptop at desk in bright modern office with large windows and green plants"
                    }
                ]
            },
            {
                messages: [
                    {
                        role: "system",
                        content: "Generate concise, descriptive alt text for web accessibility. Focus on the main subject, important details, and context that would help someone who cannot see the image understand what it shows. Keep it under 125 characters when possible."
                    },
                    {
                        role: "user",
                        content: "Generate alt text for an image of a golden retriever dog sitting in a park on grass with trees in background"
                    },
                    {
                        role: "assistant", 
                        content: "Golden retriever dog sitting on green grass in park with trees in background"
                    }
                ]
            },
            {
                messages: [
                    {
                        role: "system",
                        content: "Generate concise, descriptive alt text for web accessibility. Focus on the main subject, important details, and context that would help someone who cannot see the image understand what it shows. Keep it under 125 characters when possible."
                    },
                    {
                        role: "user",
                        content: "Generate alt text for a screenshot of a website dashboard showing analytics charts and graphs"
                    },
                    {
                        role: "assistant",
                        content: "Website dashboard interface displaying multiple analytics charts and performance graphs"
                    }
                ]
            },
            {
                messages: [
                    {
                        role: "system", 
                        content: "Generate concise, descriptive alt text for web accessibility. Focus on the main subject, important details, and context that would help someone who cannot see the image understand what it shows. Keep it under 125 characters when possible."
                    },
                    {
                        role: "user",
                        content: "Generate alt text for a photo of fresh vegetables arranged on a wooden cutting board in a kitchen"
                    },
                    {
                        role: "assistant",
                        content: "Fresh vegetables including tomatoes, carrots, and lettuce arranged on wooden cutting board"
                    }
                ]
            },
            {
                messages: [
                    {
                        role: "system",
                        content: "Generate concise, descriptive alt text for web accessibility. Focus on the main subject, important details, and context that would help someone who cannot see the image understand what it shows. Keep it under 125 characters when possible."
                    },
                    {
                        role: "user",
                        content: "Generate alt text for an image showing a student reading a book in a library with bookshelves"
                    },
                    {
                        role: "assistant",
                        content: "Student reading book while sitting at table in library surrounded by tall bookshelves"
                    }
                ]
            }
        ];
    }

    // Combine base data with user feedback data
    async generateCompleteTrainingData() {
        try {
            // Get base examples
            const baseExamples = this.getBaseTrainingData();
            
            // Get feedback data (from existing feedback system)
            const { getFeedbackAnalytics } = require('./feedback-system');
            const analytics = await getFeedbackAnalytics();
            
            // Convert high-quality feedback to training examples
            const feedbackExamples = analytics.recentFeedback
                .filter(item => item.rating >= 4 && item.userImprovement)
                .map(item => ({
                    messages: [
                        {
                            role: "system",
                            content: "Generate concise, descriptive alt text for web accessibility. Focus on the main subject, important details, and context that would help someone who cannot see the image understand what it shows. Keep it under 125 characters when possible."
                        },
                        {
                            role: "user",
                            content: `Improve this alt text: "${item.generatedAltText}"`
                        },
                        {
                            role: "assistant",
                            content: item.userImprovement
                        }
                    ]
                }));

            // Combine all training data
            const allExamples = [...baseExamples, ...feedbackExamples];
            
            // Save to JSONL format for OpenAI fine-tuning
            const jsonlData = allExamples.map(example => JSON.stringify(example)).join('\n');
            
            if (process.env.NODE_ENV !== 'production') {
                await fs.writeFile(this.trainingFile, jsonlData);
            }
            
            return {
                totalExamples: allExamples.length,
                baseExamples: baseExamples.length,
                feedbackExamples: feedbackExamples.length,
                data: jsonlData
            };
            
        } catch (error) {
            console.error('Error generating training data:', error);
            throw error;
        }
    }

    // Upload training data to OpenAI and create fine-tuned model
    async createFineTunedModel() {
        try {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OpenAI API key required for fine-tuning');
            }

            // Generate training data
            const trainingData = await this.generateCompleteTrainingData();
            
            if (trainingData.totalExamples < 10) {
                throw new Error('Need at least 10 training examples. Current: ' + trainingData.totalExamples);
            }

            // Upload training file to OpenAI
            const file = await this.openai.files.create({
                file: Buffer.from(trainingData.data),
                purpose: 'fine-tune'
            });

            console.log('Training file uploaded:', file.id);

            // Create fine-tuning job
            const fineTune = await this.openai.fineTuning.jobs.create({
                training_file: file.id,
                model: 'gpt-4o-mini', // More cost-effective for fine-tuning
                hyperparameters: {
                    n_epochs: 3
                }
            });

            console.log('Fine-tuning job created:', fineTune.id);
            
            return {
                jobId: fineTune.id,
                status: fineTune.status,
                trainingExamples: trainingData.totalExamples
            };

        } catch (error) {
            console.error('Error creating fine-tuned model:', error);
            throw error;
        }
    }

    // Check fine-tuning job status
    async checkFineTuningStatus(jobId) {
        try {
            const job = await this.openai.fineTuning.jobs.retrieve(jobId);
            
            if (job.status === 'succeeded') {
                this.fineTunedModel = job.fine_tuned_model;
                console.log('Fine-tuning completed! Model:', this.fineTunedModel);
            }
            
            return {
                status: job.status,
                model: job.fine_tuned_model,
                createdAt: job.created_at,
                finishedAt: job.finished_at
            };
            
        } catch (error) {
            console.error('Error checking fine-tuning status:', error);
            throw error;
        }
    }

    // Use fine-tuned model for alt text generation
    async generateWithFineTunedModel(imageDescription) {
        try {
            if (!this.fineTunedModel) {
                throw new Error('No fine-tuned model available');
            }

            const response = await this.openai.chat.completions.create({
                model: this.fineTunedModel,
                messages: [
                    {
                        role: "system",
                        content: "Generate concise, descriptive alt text for web accessibility. Focus on the main subject, important details, and context that would help someone who cannot see the image understand what it shows. Keep it under 125 characters when possible."
                    },
                    {
                        role: "user",
                        content: imageDescription
                    }
                ],
                max_tokens: 100,
                temperature: 0.3
            });

            return response.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('Error with fine-tuned model:', error);
            throw error;
        }
    }
}

module.exports = TrainingDataManager;