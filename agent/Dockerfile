FROM node:20-slim

WORKDIR /app

# Install pnpm and langgraph-cli
RUN npm install -g pnpm @langchain/langgraph-cli

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Expose port (Cloud Run default)
EXPOSE 8080

# Start the server
# Cloud Run injects PORT environment variable, default to 8080
CMD ["sh", "-c", "langgraphjs dev --host 0.0.0.0 --port ${PORT:-8080} --no-browser"]
