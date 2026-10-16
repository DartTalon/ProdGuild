FROM nginx:alpine

# Копируем все файлы фронтенда и картинки панд в директорию Nginx
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY api.js /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY *.webp /usr/share/nginx/html/

# Открываем порт 80 для прокси-сервера Spirit
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]