ARG NODE_VERSION=18.16.0
ARG PNPM_VERSION=8.9.2

FROM node:${NODE_VERSION}-alpine as base

WORKDIR /usr/src/app

# Install pnpm.
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

# Copy source files
COPY . .

# deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Build packages
RUN pnpm run build --filter='./packages/*'