# Frontend
FROM node:20 AS build
WORKDIR /app

# Kopiujemy tylko package.json i package-lock.json
COPY package*.json ./

# Instalacja zależności w Linuxie
RUN npm ci

# Kopiujemy resztę kodu
COPY . .

# Budowanie projektu (npm run build używa sie do produkcji, npm run dev do developmentu, dla frontu się nie używa ogolnie docker raczej, tylko dla backendu)
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
