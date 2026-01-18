# Chat interface for interacting with LLMs

## Tech Stack:

- Server - express.js
- Client - React.js


## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/santo-27/streaming-chat-interface.git
   cd streaming-chat-interface
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

## Configuration

### Server Environment Variables

Create a `.env` file in the `server` directory using the `.env.example` as template:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

You can obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

## Running the Application

### Development Mode

You need to run both the server and client simultaneously.

**Terminal 1 - Start the backend server:**
```bash
cd server
npm run dev
```
The server will start on `http://localhost:<YOUR_PORT_NUMBER>`

**Terminal 2 - Start the frontend:**
```bash
cd client
npm run dev
```
The client will start on `http://localhost:<YOUR_PORT_NUMBER>`

### Production Build

**Build the server:**
```bash
cd server
npm run build
npm run dev
```

**Build the client:**
```bash
cd client
npm run build
npm run dev
```

## Project Structure

```
streaming-chat-interface/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/        # Chat-related components
│   │   │   ├── content/     # Content rendering components
│   │   │   ├── layout/      # Layout components (Sidebar, Header)
│   │   │   └── ui/          # Reusable UI components
│   │   ├── context/         # React Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── vite.config.ts
│
├── server/                  # Express backend
│   ├── src/
│   │   └── index.ts         # Main server entry point
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Features

- **Real-time Streaming** - Responses stream in real-time using Server-Sent Events
- **Conversation Management** - Create, rename, and delete conversations
- **Private Conversations** - Mark conversations as private
- **Dark/Light Theme** - Toggle between dark and light modes
- **Markdown Support** - Full markdown rendering with syntax highlighting
- **Code Highlighting** - Syntax highlighting for code blocks
- **Responsive Design** - Works on desktop and mobile devices
- **Auto-scroll** - Automatically scrolls to new messages

## API Endpoints

### POST `/api/chat`

Send a message and receive a streaming response.

**Request Body:**
```json
{
  "message": "Your message here",
  "context": [] // Optional: previous messages for context
}
```

**Response:**
Server-Sent Events stream with chunks in the format:
```
data: {"text": "Response chunk"}
```

## Scripts

### Client
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |

### Server
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production server |

