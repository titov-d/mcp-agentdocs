# Build the server, then run it as a local stdio MCP server.
# Used by MCP directories (e.g. Glama) to start the server and run introspection,
# and for anyone who wants to run agentdocs in a container.

FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY corpus/manifest.json ./corpus/manifest.json
COPY corpus/*.md ./corpus/
# Serves the curated corpus over MCP stdio.
ENTRYPOINT ["node", "dist/index.js"]
