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

# Start the server
# Railway/Render inject PORT environment variable
CMD ["sh", "-c", "langgraphjs dev --host 0.0.0.0 --port ${PORT:-10000} --no-browser"]
