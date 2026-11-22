# Install all dependencies (including devDependencies for building)
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the TypeScript code
FROM node:24-alpine AS build-env
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Install only production dependencies
FROM node:24-alpine AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Final lightweight runtime image
FROM node:24-alpine
WORKDIR /app
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build-env /app/dist ./dist
COPY package.json ./

CMD ["npm", "run", "start"]
