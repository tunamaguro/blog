FROM node:22-bookworm-slim

RUN apt-get update -y && apt-get install -y \
    curl \
    git

USER node

RUN curl -fsSL https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

# RUN ["yarn"]