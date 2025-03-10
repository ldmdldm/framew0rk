# Framew0rk

A DeFi assistant platform powered by AI for analyzing, understanding, and executing strategies on various blockchain protocols.

## Project Overview

Framew0rk integrates:
- AI-powered analysis of DeFi protocols (via DeepSeek)
- Real-time metrics from protocols using The Graph
- Strategy recommendations based on market conditions
- Direct execution of DeFi strategies from the platform
- Custom AI training on protocol documentation

## Tech Stack

### Frontend
- React with TypeScript
- Vite as the build tool
- TailwindCSS for styling
- Apollo Client for GraphQL

### Backend
- Express.js server
- Supabase for database
- DeepSeek AI API integration
- The Graph API for blockchain data

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (if running Supabase locally)
- API keys for:
  - DeepSeek AI
  - Supabase
  - The Graph (for DeFi protocol data)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/framew0rk.git
cd framew0rk
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment setup

Create a `.env` file in the project root by copying the example file:

```bash
cp .env.example .env
```

Fill in your API keys and configuration values in the `.env` file:

```
# Server configuration
PORT=3001
NODE_ENV=development

# API keys
DEEPSEEK_API_KEY=your_deepseek_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Frontend configuration
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Database setup

If using Supabase:
1. Create a new project in the Supabase dashboard
2. Run the SQL scripts in the `database` directory to set up the schema
3. Update your `.env` file with the Supabase URL and API key

## Running the Application

### Development Mode

#### Start the backend server

```bash
# In one terminal
npm run dev:server
# or
yarn dev:server
```

#### Start the frontend development server

```bash
# In another terminal
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:5173` and will proxy API requests to the backend server running on port 3001.

### Production Build

#### Build the application

```bash
npm run build
# or
yarn build
```

#### Start the production server

```bash
npm run start
# or
yarn start
```

This will serve the static frontend files and run the API server on the same port specified in your `.env` file.

## API Endpoints

The following endpoints are available:

- `POST /api/analyze` - Analyze user messages in the context of DeFi protocols
- `POST /api/strategies/:id/execute` - Execute investment strategies
- `POST /api/protocols/:id/train` - Train AI on protocol documentation

## Project Structure

```
framew0rk/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── server/         # Express server
│   │   ├── middleware/ # Express middleware
│   │   ├── routes/     # API routes
│   │   ├── lib/        # Server utilities
│   │   └── index.ts    # Server entry point
│   ├── utils/          # Shared utilities
│   ├── App.tsx         # Main React component
│   └── main.tsx        # Frontend entry point
├── public/             # Static assets
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Development Workflow

1. Make changes to the frontend code in the `src` directory
2. The Vite dev server will automatically reload when changes are detected
3. Make changes to the backend code in the `src/server` directory
4. The server will automatically restart when changes are detected

## Troubleshooting

If you encounter CORS issues:
- Ensure the backend server CORS configuration includes your frontend URL
- Check that the Vite proxy is correctly configured for API requests

If API requests fail:
- Verify your API keys in the `.env` file
- Ensure the backend server is running
- Check server logs for error messages

## License

[MIT](LICENSE)

# Framew0rk - AI-Powered DeFi Strategy Assistant

Framew0rk is a sophisticated DeFi strategy assistant that leverages AI to help users optimize their cryptocurrency portfolio through advanced blockchain analysis and automated strategy execution.

![Framew0rk Screenshot](https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2000)

## Features

- 🤖 **AI-Powered Analysis**: Get personalized DeFi strategy recommendations based on your goals and risk tolerance
- 📊 **Multi-Chain Support**: Analyze opportunities across Ethereum, Arbitrum, Optimism, and Polygon
- 💼 **Portfolio Management**: Track and manage your DeFi positions across multiple protocols
- 🔄 **Automated Execution**: Execute recommended strategies directly through the interface
- 🛡️ **Risk Assessment**: Real-time risk analysis and monitoring of your positions
- 📈 **Protocol Integration**: Deep integration with major DeFi protocols like Uniswap, Aave, Compound, and more

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-4
- **Blockchain Data**: The Graph Protocol
- **State Management**: React Context
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/framew0rk.git
cd framew0rk
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
framew0rk/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── server/         # Backend server code
│   │   ├── lib/        # Server utilities
│   │   ├── routes/     # API routes
│   │   └── middleware/ # Express middleware
│   ├── types/          # TypeScript type definitions
│   └── plugin/         # Embeddable widget code
├── public/             # Static assets
└── dist/              # Production build output
```

## Features in Detail

### AI Strategy Assistant
- Natural language interaction for strategy queries
- Context-aware responses based on market conditions
- Personalized recommendations based on user preferences
- Real-time market data integration

### Portfolio Analysis
- Multi-chain position tracking
- Performance metrics and analytics
- Risk assessment and alerts
- Historical performance tracking

### Protocol Integration
- Real-time data from major DeFi protocols
- Automated strategy execution
- Position management across protocols
- APY/APR optimization

### Risk Management
- Real-time risk monitoring
- Position health checks
- Liquidation risk alerts
- Portfolio diversification analysis

## Development

### Running the Project

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm run start:server
```

### Plugin Development

Build the embeddable widget:
```bash
npm run build:plugin
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.