FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
RUN npm install
COPY . .
RUN npm run build --workspace apps/backend
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace", "apps/backend"]
