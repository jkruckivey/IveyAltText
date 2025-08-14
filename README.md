# AI Alt Text Generator

A modern web application that uses artificial intelligence to automatically generate descriptive alt text for images, improving web accessibility.

## Features

- 🖼️ **Drag & Drop Upload**: Easy image upload with drag and drop support
- 🤖 **AI-Powered**: Uses OpenAI's GPT-4 Vision model for accurate descriptions
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 📋 **Copy to Clipboard**: One-click copying of generated alt text
- 🎯 **Accessibility Focused**: Built with web accessibility best practices
- ⚡ **Fast & Lightweight**: Quick processing and minimal dependencies

## Demo

The application works with or without an OpenAI API key:
- **With API key**: Uses GPT-4 Vision for accurate, AI-generated descriptions
- **Without API key**: Uses mock responses for demonstration purposes

## Quick Start

1. **Clone or Download** this repository
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the application**:
   ```bash
   npm start
   ```
4. **Open your browser** to `http://localhost:3000`

## Configuration

### OpenAI API Key (Optional)

To use real AI-generated alt text, you'll need an OpenAI API key:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Copy `.env.example` to `.env`
3. Add your API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (optional)
- `PORT`: Server port (default: 3000)

## Deployment

### Deploy to Render

1. **Connect your GitHub repository** to Render
2. **Create a new Web Service**
3. **Configure the service**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add your `OPENAI_API_KEY` if using OpenAI

### Deploy to Other Platforms

The application is compatible with most Node.js hosting platforms:
- Heroku
- Vercel
- Netlify Functions
- Railway
- DigitalOcean App Platform

## API Endpoints

### POST `/api/generate-alt-text`
Generates alt text for an uploaded image.

**Request**: 
- Content-Type: `multipart/form-data`
- Body: `image` (image file)

**Response**:
```json
{
  "altText": "A description of the image content"
}
```

### GET `/api/health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "hasOpenAI": true
}
```

## File Structure

```
ai-alt-text-generator/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # Frontend JavaScript
├── server.js           # Node.js server
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
├── .env               # Your environment variables
└── README.md          # This file
```

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- Mobile browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.

## Accessibility Features

This tool is built with accessibility in mind:
- Keyboard navigation support
- Screen reader compatibility
- High contrast design
- Semantic HTML structure
- ARIA labels where appropriate

## Tips for Better Alt Text

The AI generates good alt text, but you can always edit it to:
- Add context specific to your website
- Include relevant keywords for SEO
- Adjust tone to match your content style
- Remove or add details as needed

## Troubleshooting

**Common Issues:**

1. **"Failed to generate alt text"**
   - Check if your OpenAI API key is valid
   - Ensure you have sufficient API credits
   - Try with a smaller image file

2. **Upload not working**
   - Ensure the file is a valid image (JPG, PNG, GIF, WebP)
   - Check that the file is under 5MB
   - Try a different browser

3. **Server won't start**
   - Make sure Node.js is installed (version 18+)
   - Run `npm install` to install dependencies
   - Check if port 3000 is already in use

## Support

If you encounter any issues or have questions, please open an issue on GitHub.