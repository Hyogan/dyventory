FROM php:8.3-fpm-alpine

# ── System dependencies ─────────────────────────────────────────────
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    postgresql-dev \
    linux-headers \
    icu-dev \
    $PHPIZE_DEPS

# ── Install Redis (ONLY ONCE) ───────────────────────────────────────
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# ── PHP extensions ──────────────────────────────────────────────────
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    sockets \
    intl

# ── Redis extension ─────────────────────────────────────────────────
# RUN pecl install redis && docker-php-ext-enable redis

# ── OPcache (production performance) ────────────────────────────────
RUN docker-php-ext-install opcache
COPY infra/api/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# ── Composer ────────────────────────────────────────────────────────
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# ── Working directory ────────────────────────────────────────────────
WORKDIR /var/www/html

# ── PHP-FPM config ───────────────────────────────────────────────────
COPY infra/api/php.ini /usr/local/etc/php/conf.d/dyventory.ini

EXPOSE 9000

CMD ["php-fpm"]