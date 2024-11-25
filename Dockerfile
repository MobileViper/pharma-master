# Step 1: Use a base image
FROM node:16-alpine

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy the package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Step 4: Copy the rest of the application code
COPY . .

# Step 5: Expose the port that the app runs on
EXPOSE 3000

# Step 6: Define the command to run the app
CMD ["node", "server.js"]
