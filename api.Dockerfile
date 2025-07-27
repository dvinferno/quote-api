FROM oven/bun

WORKDIR /app

# Copy only the files needed for installation
COPY apps/api/package.json ./

# Install dependencies inside the container
RUN bun install

# Now copy the actual source code
COPY apps/api /app

EXPOSE 3002
CMD ["bun", "index.ts"]