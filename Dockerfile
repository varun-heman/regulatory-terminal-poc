# Build and run Terminal in one small image.
#
# The build stage needs the dev dependencies; the runtime stage needs none at
# all — the server is Node's own http, fs and zlib — so the final image carries
# the built app and nothing else.

FROM node:18-alpine AS build
WORKDIR /app

# Dependencies first: this layer is only invalidated by a lockfile change
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY server ./server
RUN npm run build


FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY package.json ./

# Never run as root. The node image already ships an unprivileged `node` user.
USER node

EXPOSE 8080

# The app answers /healthz without credentials, so this works behind the gate
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
