class AltTextGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentImage = null;
        this.currentRating = 0;
        this.generatedAltText = '';
    }

    initializeElements() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.previewSection = document.getElementById('preview-section');
        this.previewImage = document.getElementById('preview-image');
        this.generateBtn = document.getElementById('generate-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.resultSection = document.getElementById('result-section');
        this.altTextOutput = document.getElementById('alt-text-output');
        this.copyBtn = document.getElementById('copy-btn');
        this.htmlExample = document.getElementById('html-example');
        
        // Feedback elements
        this.stars = document.querySelectorAll('.star');
        this.improvementSection = document.querySelector('.improvement-section');
        this.improvementText = document.getElementById('improvement-text');
        this.submitFeedbackBtn = document.getElementById('submit-feedback');
    }

    bindEvents() {
        // File input events
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));

        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Button events
        this.generateBtn.addEventListener('click', () => this.generateAltText());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        
        // Feedback events
        this.stars.forEach(star => {
            star.addEventListener('click', (e) => this.handleStarClick(e));
            star.addEventListener('mouseover', (e) => this.handleStarHover(e));
        });
        document.querySelector('.rating-stars').addEventListener('mouseleave', () => this.resetStarDisplay());
        this.submitFeedbackBtn.addEventListener('click', () => this.submitFeedback());

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDragOver(e) {
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        this.dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }

    handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('File size must be less than 5MB.');
            return;
        }

        this.currentImage = file;
        this.displayImage(file);
    }

    displayImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.previewSection.style.display = 'block';
            this.resultSection.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    async generateAltText() {
        if (!this.currentImage) return;

        try {
            this.setGenerateButtonLoading(true);
            
            // Convert image to base64
            const base64Image = await this.fileToBase64(this.currentImage);
            
            // Call the vision API
            const altText = await this.callVisionAPI(base64Image);
            
            this.displayResult(altText);
        } catch (error) {
            console.error('Error generating alt text:', error);
            this.showError('Failed to generate alt text. Please try again.');
        } finally {
            this.setGenerateButtonLoading(false);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async callVisionAPI(base64Image) {
        const formData = new FormData();
        formData.append('image', this.currentImage);

        const response = await fetch('/api/generate-alt-text', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate alt text');
        }

        const data = await response.json();
        return data.altText;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    displayResult(altText) {
        this.generatedAltText = altText;
        this.altTextOutput.value = altText;
        this.htmlExample.textContent = `<img src="your-image.jpg" alt="${altText}">`;
        this.resultSection.style.display = 'block';
        this.resetFeedbackState();
        this.showSuccess('Alt text generated successfully!');
    }

    setGenerateButtonLoading(loading) {
        if (loading) {
            this.generateBtn.disabled = true;
            this.generateBtn.innerHTML = '<div class="loading"><span class="spinner"></span> Generating...</div>';
        } else {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = 'Generate Alt Text';
        }
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.altTextOutput.value);
            this.showSuccess('Alt text copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            this.altTextOutput.select();
            document.execCommand('copy');
            this.showSuccess('Alt text copied to clipboard!');
        }
    }

    clearAll() {
        this.currentImage = null;
        this.fileInput.value = '';
        this.previewSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.clearMessages();
    }

    showError(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        this.previewSection.parentNode.insertBefore(errorDiv, this.previewSection);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        this.resultSection.parentNode.insertBefore(successDiv, this.resultSection);
        setTimeout(() => successDiv.remove(), 3000);
    }

    clearMessages() {
        document.querySelectorAll('.error, .success').forEach(el => el.remove());
    }

    // Feedback system methods
    handleStarClick(e) {
        const rating = parseInt(e.target.dataset.rating);
        this.currentRating = rating;
        this.updateStarDisplay(rating);
        
        // Show improvement section if rating is low
        if (rating <= 3) {
            this.improvementSection.style.display = 'block';
        } else {
            this.improvementSection.style.display = 'none';
            // Auto-submit positive feedback
            setTimeout(() => this.submitFeedback(), 500);
        }
    }

    handleStarHover(e) {
        const rating = parseInt(e.target.dataset.rating);
        this.updateStarDisplay(rating);
    }

    resetStarDisplay() {
        this.updateStarDisplay(this.currentRating);
    }

    updateStarDisplay(rating) {
        this.stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    resetFeedbackState() {
        this.currentRating = 0;
        this.updateStarDisplay(0);
        this.improvementSection.style.display = 'none';
        this.improvementText.value = '';
        document.querySelectorAll('.feedback-success').forEach(el => el.remove());
    }

    async submitFeedback() {
        if (this.currentRating === 0) {
            this.showError('Please select a rating first.');
            return;
        }

        try {
            const feedbackData = {
                generatedAltText: this.generatedAltText,
                rating: this.currentRating,
                userImprovement: this.improvementText.value || null,
                imageType: this.currentImage?.type || null,
                helpful: this.currentRating >= 4
            };

            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            if (response.ok) {
                this.showFeedbackSuccess('Thank you for your feedback! This helps us improve.');
                // Disable the feedback section after submission
                document.querySelector('.feedback-section').style.opacity = '0.6';
                document.querySelector('.feedback-section').style.pointerEvents = 'none';
            } else {
                throw new Error('Failed to submit feedback');
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.showError('Failed to submit feedback. Your input is still valuable!');
        }
    }

    showFeedbackSuccess(message) {
        // Remove existing feedback success messages
        document.querySelectorAll('.feedback-success').forEach(el => el.remove());
        
        const successDiv = document.createElement('div');
        successDiv.className = 'feedback-success';
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        document.querySelector('.feedback-section').appendChild(successDiv);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AltTextGenerator();
});