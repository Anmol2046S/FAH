# 🍽️ FAH - Food and Health AI App

An AI-powered food and health analysis application that helps users make better nutritional and health decisions. Built with Node.js, HTML5, and AI integration.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-14%2B-brightgreen)

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Docker Setup](#docker-setup)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **AI-Powered Analysis**: Uses AI to analyze food nutritional content
- **Health Recommendations**: Personalized health suggestions based on food analysis
- **Real-time Processing**: Instant food analysis and health metrics
- **Responsive UI**: Mobile-friendly web interface
- **Docker Support**: Easy deployment with Docker containers
- **Environment Configuration**: Flexible environment setup with .env files
- **RESTful API**: Clean API endpoints for integrations

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla/Node.js)
- Responsive Design

### Backend
- Node.js 14+
- Express.js (implied from package.json)
- AI/ML Integration

### Deployment
- Docker
- Docker Compose

### Environment
- Node Package Manager (npm)

## 📁 Project Structure

```
FAH/
├── index.html          # Main UI/Frontend
├── index.js            # Backend server logic
├── package.json        # Node.js dependencies
├── Dockerfile          # Docker configuration
├── .env.example        # Environment variables template
├── .dockerignore        # Docker ignore file
├── LICENSE             # MIT License
└── node_modules/       # Dependencies (auto-generated)
```

## 🚀 Installation

### Prerequisites
- Node.js 14.0+
- npm 6.0+
- Git
- (Optional) Docker & Docker Compose

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anmol2046S/FAH.git
   cd FAH
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the app**
   ```
   http://localhost:3000
   ```

## 💻 Usage

### Analyzing Food

1. Open the web interface at `http://localhost:3000`
2. Enter food name or description
3. Click "Analyze"
4. View AI-powered nutritional analysis and health recommendations

### API Integration

```javascript
// Example API call
fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    food: 'apple',
    quantity: '100g'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Analyze food |
| GET | `/api/health` | Get health recommendations |
| GET | `/api/nutrition` | Get nutrition data |
| GET | `/health` | Health check endpoint |

## 🐳 Docker Setup

### Build Docker Image

```bash
docker build -t fah-app .
```

### Run Container

```bash
docker run -p 3000:3000 --env-file .env fah-app
```

### Docker Compose (if available)

```bash
docker-compose up --build
```

### Verify Container

```bash
docker ps
curl http://localhost:3000
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file from `.env.example`:

```env
PORT=3000
NODE_ENV=development
API_KEY=your_ai_api_key
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=30000
DATABASE_URL=optional_db_connection
```

### Key Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `API_KEY` - AI service API key
- `LOG_LEVEL` - Logging level (info/debug/error)

## 📦 Dependencies

From `package.json`:
```json
{
  "dependencies": {
    // Core dependencies listed in package.json
  },
  "devDependencies": {
    // Development dependencies
  }
}
```

### Install Specific Package

```bash
npm install package-name
```

### Update Dependencies

```bash
npm update
```

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run with debug mode
DEBUG=* npm start
```

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Change port in .env or use environment variable
PORT=3001 npm start
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Docker Build Fails

```bash
# Clear Docker cache and rebuild
docker system prune
docker build --no-cache -t fah-app .
```

### Environment Variables Not Loading

- Verify `.env` file exists in project root
- Check file permissions: `chmod 644 .env`
- Restart application after changes

## 📚 API Documentation

### Analyze Food Endpoint

**POST** `/api/analyze`

**Request:**
```json
{
  "food": "chicken breast",
  "quantity": "100g",
  "preferences": "vegan"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "food": "chicken breast",
    "calories": 165,
    "protein": 31g,
    "carbs": 0g,
    "fat": 3.6g,
    "healthScore": 8.5,
    "recommendations": []
  }
}
```

## 🔐 Security

- Never commit `.env` files with real credentials
- Use `.env.example` as template
- Rotate API keys regularly
- Validate all user inputs
- Use HTTPS in production

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

## 🔗 Links

- **Repository**: https://github.com/Anmol2046S/FAH
- **Issues**: https://github.com/Anmol2046S/FAH/issues
- **Discussions**: https://github.com/Anmol2046S/FAH/discussions

## 📞 Support

For support, create an issue in the GitHub repository or check the documentation.

---

**Made with ❤️ for better health and nutrition**
