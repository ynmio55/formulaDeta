# OpenF1 Data Platform

A powerful, high-performance web application built with Next.js 16 to visualize and analyze Formula 1 telemetry and race data, powered by the [OpenF1 API](https://openf1.org/).

## Features

- **Overview Dashboard**: Live view of the latest Grand Prix session, including fast access to track temperatures, pit stop counts, and winner info.
- **Season Explorer**: Browse historical meetings back to 2023.
- **Session Dashboard**: Unified tab-based interface to view Classification (results), Starting Grid, Race Control messages, Weather, and Pit Stop strategy.
- **Driver Comparison**: Compare telemetry (Speed & Throttle traces) for up to 4 drivers simultaneously using massive downsampled datasets visualized via Apache ECharts.
- **Track Position**: Visualization of the circuit using x,y coordinates from the location endpoint.
- **Team Radio**: Listen directly to driver radio communications with integrated HTML5 audio playback.
- **Championship Standings**: Real-time Drivers and Constructors championship standings (Beta).
- **API Explorer**: An interactive Query Builder to test the OpenF1 API directly from your browser, preview URLs, and see JSON responses.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS (Dark Graphite Theme)
- **Data Fetching**: TanStack React Query (Server/Client caching)
- **State Management**: Zustand
- **Schema Validation**: Zod
- **Charting**: ECharts (echarts-for-react)
- **Icons**: Lucide React
- **Testing**: Vitest & Playwright

## Getting Started

1. **Clone the repository** and install dependencies:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *The app proxies requests to `https://api.openf1.org/v1` by default.*

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

## API Proxy Strategy

To circumvent CORS issues and implement robust caching, this application routes all OpenF1 requests through a Next.js Edge-compatible route handler (`src/app/api/openf1/[...endpoint]/route.ts`).
- **Live endpoints** (like telemetry/car_data) have very short `s-maxage` caches.
- **Historical endpoints** (like meetings and session results) have long `s-maxage` caches (up to 24h) to reduce upstream API load.

## Testing

Run unit tests (testing the Query Builder):
```bash
npm run test
```

## Disclaimer

This project is an open-source data visualization platform. It is not affiliated with Formula 1, Formula One Management, Formula One Administration, Formula One World Championship, or any related organizations. Data is provided by the community-driven OpenF1 project.
"# formulaDeta" 
