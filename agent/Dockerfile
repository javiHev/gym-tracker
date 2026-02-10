FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Start the server
# Railway injects PORT environment variable
CMD ["sh", "-c", "npx @langchain/langgraph-cli dev --host 0.0.0.0 --port ${PORT:-8123} --no-browser"]
