# AI Feedback App

A general purpose AI-powered feedback collection application. As a use case example, this project demonstrates its deployment for LEGOLAND Discovery Center Toronto, but it is designed to be adaptable for any organization or event.

## 🎯 Overview

This application provides an interactive feedback collection system that can be tailored for various venues, events, or organizations. The included example is for LEGOLAND Discovery Center Toronto, but the system is built to be flexible and extensible for other use cases.

It offers two distinct interaction modes:

- **Chat Mode**: Text-based conversation interface
- **Voice Mode**: Voice-activated interaction with speech synthesis

## 🚀 Features

### Core Functionality
- **Dual Interaction Modes**: Chat and voice interfaces for accessibility
- **Structured Feedback Collection**: Systematic gathering of visitor feedback across 5 key areas
- **Real-time Processing**: Instant response generation and conversation flow
- **Data Persistence**: Automatic saving to multiple formats (CSV, JSON, Excel)
- **Progress Tracking**: Visual progress indicators for feedback completion

### Technical Features
- **Modern UI/UX**: Clean, responsive design with smooth animations
- **Voice Recognition**: Real-time speech-to-text conversion
- **Speech Synthesis**: Natural voice responses
- **State Management**: Robust conversation state handling
- **Error Handling**: Comprehensive error management and fallbacks

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Web Speech API**: Voice recognition and synthesis

### Backend
- **FastAPI**: High-performance Python web framework
- **Pydantic**: Data validation and serialization
- **Pandas**: Data manipulation and CSV handling
- **OpenPyXL**: Excel file operations
- **Together AI**: Language model integration

## 📁 Project Structure

```
AI-Feedback-App/
├── backend/
│   ├── main.py              # FastAPI server with endpoints
│   ├── feedback.csv         # Feedback data storage
│   ├── feedback.json        # JSON format feedback
│   └── feedback.xlsx        # Excel format feedback
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx      # Chat page routing
│   │   │   ├── components/
│   │   │   │   ├── ChatBox.tsx      # Text chat interface
│   │   │   │   ├── LandingPage.tsx  # Landing page interface
│   │   │   │   └── VoiceOrb.tsx     # Voice interaction interface
│   │   │   ├── services/
│   │   │   │   ├── apiService.ts    # API communication
│   │   │   │   └── voiceService.ts  # Voice processing
│   │   │   ├── voice/
│   │   │   │   ├── page.tsx      # Voice page routing
│   │   │   └── layout.tsx           # App layout
│   │   └── ...
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Together AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DheerajR067/legoland-feedback-app.git
   cd legoland-feedback-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   ```bash
   # Backend (.env)
   TOGETHER_API_KEY=your_together_api_key_here
   ```

5. **Run the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn main:app --reload --port 8000

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Choose between Chat or Voice mode

## 📊 Feedback Questions

The application systematically collects feedback on:

1. **Overall Experience Rating** (1-10 scale)
2. **Favorite Attraction/Activity**
3. **Improvement Suggestions**
4. **Recommendation Likelihood** (with reasoning)
5. **Additional Comments**

## 🔧 API Endpoints

### Backend Endpoints
- `GET /health` - Health check
- `POST /chat` - Process conversation messages
- `POST /feedback` - Save structured feedback data
- `POST /rag` - Retrieve relevant information

### Data Storage
- **CSV Format**: `feedback.csv` for spreadsheet analysis
- **JSON Format**: `feedback.json` for programmatic access
- **Excel Format**: `feedback.xlsx` for detailed reporting

## 🎨 UI/UX Features

### Chat Mode
- Clean, modern chat interface
- Real-time message exchange
- Progress tracking indicator
- Responsive design for all devices

### Voice Mode
- Interactive voice orb with animations
- Real-time voice recognition
- Speech synthesis for responses
- Visual state indicators (listening, processing, speaking)

## 🔄 Development Status

### ✅ Completed (Base End-to-End Model)
- **Core Functionality**: Complete feedback collection system
- **Dual Interfaces**: Both chat and voice modes working
- **Data Persistence**: Multi-format data storage
- **API Integration**: Full backend-frontend communication
- **Basic UI**: Functional and responsive interface

### 🚧 Next Iteration (Planned Improvements)
- **Enhanced UI/UX**: More polished visual design
- **Smoother Experience**: Improved animations and transitions
- **Advanced Voice Features**: Better speech recognition accuracy
- **Analytics Dashboard**: Feedback visualization and insights
- **Mobile Optimization**: Enhanced mobile experience
- **Accessibility**: WCAG compliance improvements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- LEGOLAND Discovery Center Toronto for the feedback requirements
- Together AI for language model capabilities
- Next.js and FastAPI communities for excellent documentation

## 📞 Support

For support or questions, please open an issue in the GitHub repository or contact the development team.

---

**Note**: This is a base end-to-end model ready for deployment. The next iteration will focus on enhanced UI/UX and smoother user experience improvements. 