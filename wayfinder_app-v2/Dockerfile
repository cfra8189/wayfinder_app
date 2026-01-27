# Build stage
FROM node:20-alpine AS build
WORKDIR /app
# Copy only the subproject package files (build context is repo root)
# Copy subproject package files and install all deps (including dev) for build
COPY ./wayfinder_app-v2/package.json ./wayfinder_app-v2/package-lock.json ./
RUN npm ci
# Copy subproject source into the image
COPY ./wayfinder_app-v2 .
# Ensure any backup migration is available at expected path
RUN if [ -d ./drizzle_backup ]; then mkdir -p ./drizzle && cp ./drizzle_backup/0000_thin_fat_cobra.sql ./drizzle/ || true; fi
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
EXPOSE 3000
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/drizzle ./drizzle

# Run migrations (safe to ignore failures) then start the server
CMD ["sh", "-c", "node scripts/push_to_postgres.js || true && node dist/server/index.js"]
