#### CSC4008 Pastoral Care Team 3

## TypeScript Web Page

A basic web page built with TypeScript, featuring interactive counter and message input functionality.

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript code:
   ```bash
   npm run build
   ```

3. Open `index.html` in your web browser.

### Development

To watch for changes and automatically rebuild:
```bash
npm run watch
```

### Docker Setup (Recommended for Team Members)

The easiest way to run the project regardless of your build system:

#### Prerequisites
1. **Install Docker Desktop**: Download from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **Start Docker Desktop**: Make sure Docker Desktop is running before building/running containers
   - On macOS: Open Docker Desktop from Applications
   - On Windows: Start Docker Desktop from Start Menu
   - On Linux: Start Docker daemon with `sudo systemctl start docker`

#### Using Docker Compose (Recommended)
```bash
docker-compose up --build
```
Then open http://localhost:8080 in your browser.

#### Using Docker directly
```bash
# Build the image
docker build -t pastoral-team3-web .

# Run the container
docker run -p 8080:8080 pastoral-team3-web
```
Then open http://localhost:8080 in your browser.

#### Stop the container
If using docker-compose:
```bash
docker-compose down
```

If using docker directly, press `Ctrl+C` or find the container ID and run:
```bash
docker stop <container-id>
```

#### Troubleshooting

**Error: "Cannot connect to the Docker daemon"**
- Make sure Docker Desktop is running
- On macOS: Check the Docker icon in the menu bar and ensure it shows "Docker Desktop is running"
- Try restarting Docker Desktop

**Error: "DEPRECATED: The legacy builder is deprecated"**
- This is just a warning and won't prevent the build from working
- To use BuildKit (optional): Set `DOCKER_BUILDKIT=1` environment variable or enable it in Docker Desktop settings

### Project Structure

- `index.html` - Main HTML file with dashboard UI
- `src/index.ts` - Frontend TypeScript code
- `src/server.ts` - Express backend server
- `src/triage.ts` - Frontend triage UI component
- `src/api/triage.ts` - Triage API endpoints
- `src/services/pipeline.ts` - Email processing pipeline
- `src/graph.ts` - Microsoft Graph API integration
- `src/azureOpenAIModel.ts` - Azure OpenAI classification
- `styles.css` - CSS styling
- `tsconfig.json` - TypeScript configuration
- `dist/` - Compiled JavaScript output (generated after build)
- `Dockerfile` - Docker configuration for containerized deployment
- `docker-compose.yml` - Docker Compose configuration with MongoDB
- `SETUP.md` - Detailed setup guide for Azure and environment configuration

### Configuration

See `SETUP.md` for detailed instructions on:
- Setting up Azure App Registration for Microsoft Graph
- Configuring Azure OpenAI
- Environment variables
- API endpoints

### Quick Start

1. Install dependencies: `npm install`
2. Create `.env` file (see `SETUP.md`)
3. Build: `npm run build`
4. Start: `npm start` or `docker-compose up`
5. Access: http://localhost:3000
6. Navigate to **Triage** section in the sidebar
