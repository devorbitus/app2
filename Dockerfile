FROM node:14

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json /app/

RUN npm ci --only=production

# Bundle app source
COPY . /app/

EXPOSE 3000
CMD [ "npm", "run", "start" ]
