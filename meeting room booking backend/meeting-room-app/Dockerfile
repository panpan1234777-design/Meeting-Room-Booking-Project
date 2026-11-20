
FROM serversideup/php:8.4-fpm-nginx

USER root

WORKDIR /var/www/html

COPY --chown=www-data:www-data . .

RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

ENV APP_ENV=production
ENV APP_DEBUG=false
ENV NGINX_WEBROOT=/var/www/html/public

EXPOSE 8080
