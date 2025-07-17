# # OLD VERSION
# # Stage 1: Build Vite React App
# FROM node:20.15.1 AS frontend_builder
# # Create and use app directory as root of stage. 
# WORKDIR /app
# # Copy local files into stage, at /app
# COPY /frontend/package*.json ./
# # Install dependencies within container, at /app
# RUN npm install
# # Copy the rest of the local code into the container, at /app
# COPY ./frontend .
# # Build the application and save it in app/dist
# RUN npm run build



# # Stage 2: Serve with Pocketbase
# FROM alpine:latest

# ARG PB_VERSION=0.22.17

# RUN apk add --no-cache \
#     unzip \
#     ca-certificates
# # This is needed only if you want to use scp to copy later your pb_data locally
# # Remember to add a "\" after the previous apk. It's the syntax.
# # openssh

# # download and unzip PocketBase into container at /pb/
# ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
# RUN unzip /tmp/pb.zip -d /pb/

# # uncomment to copy the local pb_migrations dir into the container
# # COPY ./backend/pb_migrations /pb/pb_migrations

# # uncomment to copy the local pb_hooks dir into the container
# # COPY ./backend/pb_hooks /pb/pb_hooks

# # uncomment to copy the local pb_public dir into the container
# # COPY ./backend/pb_public /pb/pb_public

# # Copy everything inside the dist folder from the first stage to 
# #   this stage at /pb/public
# COPY --from=frontend_builder /app/dist /pb/pb_public

# EXPOSE 8080

# # start PocketBase
# CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]






# NEW VERSION //////////////////////////////////////////////////////////////
# Stage 1: Build Vite React App
FROM node:20.15.1 AS frontend_builder
# Create and use app directory as root of stage. 
WORKDIR /app

# ca-certificates is not needed here because it's already included by 
#   default in this node:20.15.1 image.

# Copy local files into stage, at /app
COPY /frontend/package*.json ./
# Install dependencies within container, at /app
RUN npm install
# Copy the rest of the local code into the container, at /app
COPY ./frontend .
# Build the application and save it in app/dist
RUN npm run build



# Stage 2: Build Pocketbase with Custom Hooks
FROM golang:1.23-alpine AS go_builder
WORKDIR /build

# Install unzip and CA certificates for Go download. ca-certificates is needed
#   here for https calls like go mod download.
RUN apk add --no-cache \
    unzip \
    ca-certificates
# This is needed only if you want to use scp to copy later your pb_data locally
# Remember to add a "\" after the previous apk. It's the syntax.
# openssh

# Download PocketBase source code. Note: this is NOT the precompiled pocketbase binary (like 
#   in the old docker script above) since we need the raw source code to extend pocketbase.
# ADD https://github.com/pocketbase/pocketbase/archive/refs/tags/v0.22.17.zip /tmp/pocketbase.zip
# RUN unzip /tmp/pocketbase.zip -d .

# Copy go.mod and go.sum before copying the full source code
# This helps to cache the module downloads in Docker
# COPY ./backend/go.mod /build/pocketbase/
# If there's a go.sum file, copy it as well by uncommenting below...
COPY ./backend/go.mod ./backend/go.sum /build/pocketbase/

# Download dependencies
WORKDIR /build/pocketbase
RUN go mod download

# Copy the actual Go source code
# # COPY ./backend/pb_hooks /build/pocketbase/pb_hooks
COPY ./backend/main.go /build/pocketbase/
# # uncomment to copy the local middleware dir into the container
# # COPY ./backend/middleware /build/pocketbase/middleware
# # uncomment to copy the local pb_migrations dir into the container
# # COPY ./backend/pb_migrations /build/pocketbase/pb_migrations
# # uncomment to copy the local pb_public dir into the container
# # COPY ./backend/pb_public /build/pocketbase/pb_public

# Run go mod tidy to clean up dependencies based on the source code
RUN go mod tidy

# Build the custom Pocketbase binary
#   The -o flag specifies the output file name and location.
#   This will place the binary at /pb/pocketbase in the final image.
#   The build context is the current working directory (.), which includes all subdirectories.
#       -o /pb/pocketbase: Indicates that the binary should be named 
#       pocketbase and placed in the /pb directory.
# Linux Alpine does not require the use of extensions (.exe)
RUN go build -o /pb/pocketbase .



# Stage 3: Serve with Pocketbase. Linux Alpine image will be used to run the binary.
FROM alpine:latest
RUN apk add --no-cache ca-certificates

# Copy the custom Pocketbase binary from the build stage
COPY --from=go_builder /pb/pocketbase ./

# Copy the built frontend from the first stage
COPY --from=frontend_builder /app/dist ./pb_public/

# Expose the Pocketbase port
EXPOSE 8080

# Start Pocketbase
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8080"]







# # Use a Node.js base image
# FROM node:20.15.1

# # Set the working directory
# WORKDIR /app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the application code
# COPY . .

# # Build the application
# RUN npm run build

# # Expose the port Vite preview will run on
# EXPOSE 8080

# # Start the Vite preview server
# CMD ["npm", "run", "preview"]

# Use this instead when you decide to switch to nginx
# Don't forget to remove nginx.conf from .dockerignore
# FROM node:18 AS build

# WORKDIR /app

# COPY package*.json ./
# RUN npm install

# COPY . .

# RUN npm run build


# FROM nginx:1.25.1

# COPY --from=build /app/dist /usr/share/nginx/html

# EXPOSE 8080

# CMD ["nginx", "-g", "daemon off;"]


