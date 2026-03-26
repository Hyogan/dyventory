FROM php:8.2-fpm-alpine

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
    $PHPIZE_DEPS

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
    sockets

# ── Redis extension ─────────────────────────────────────────────────
RUN pecl install redis && docker-php-ext-enable redis

# ── OPcache (production performance) ────────────────────────────────
RUN docker-php-ext-install opcache
COPY infra/api/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# ── Composer ────────────────────────────────────────────────────────
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# ── Working directory ────────────────────────────────────────────────
WORKDIR /var/www/html

# ── PHP-FPM config ───────────────────────────────────────────────────
COPY infra/api/php.ini /usr/local/etc/php/conf.d/stoky.ini

EXPOSE 9000

CMD ["php-fpm"]