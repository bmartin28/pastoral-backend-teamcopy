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

- `index.html` - Main HTML file
- `src/index.ts` - TypeScript source code
- `styles.css` - CSS styling
- `tsconfig.json` - TypeScript configuration
- `dist/` - Compiled JavaScript output (generated after build)
- `Dockerfile` - Docker configuration for containerized deployment
- `docker-compose.yml` - Docker Compose configuration for easy setup
