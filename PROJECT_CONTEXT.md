# PROJECT_CONTEXT.md

> Last updated: 2026-04-07
> Workspace root: `C:\Insurance`
> Canonical copy: `C:\Insurance\PROJECT_CONTEXT.md`
> Synced copies:
> - `C:\Insurance\InsuranceApp\PROJECT_CONTEXT.md`
> - `C:\Insurance\InsuranceMobileApp\PROJECT_CONTEXT.md`

## 1. System Overview

This workspace contains one product delivered through two sibling projects:

- `InsuranceApp/`: the main Laravel 12 application. It serves both the browser-based admin interface and the REST API consumed by the mobile app.
- `InsuranceMobileApp/`: the Ionic 8 + Angular 20 + Capacitor 8 Android client used by beneficiaries and field staff.

This is not a "two-server" architecture. In production, the backend server hosts the Laravel application only. The mobile app is built into an Android package (`APK` or `AAB`) and installed on devices. Those devices then call the public Laravel API over HTTPS.

Primary business functions:

- beneficiary registration and login
- household enrollment and document upload
- policy renewal
- subsidy eligibility and approval flows
- premium payments through Khalti, eSewa, and ConnectIPS
- push notifications through Firebase Cloud Messaging (FCM)
- browser-based admin workflows for dashboard, approvals, reports, users, roles, facilities, and policy rules

## 2. Repository Layout

```text
C:\Insurance
|-- PROJECT_CONTEXT.md
|-- InsuranceApp\
|   |-- app\
|   |-- bootstrap\
|   |-- config\
|   |-- database\
|   |-- public\
|   |-- resources\
|   |-- routes\
|   |-- storage\
|   |-- tests\
|   |-- composer.json
|   |-- package.json
|   `-- vite.config.js
`-- InsuranceMobileApp\
    |-- android\
    |-- src\
    |-- www\
    |-- angular.json
    |-- capacitor.config.ts
    `-- package.json
```

## 3. Verified Stack And Runtime

### Backend: `InsuranceApp`

- Framework: Laravel `^12.0`
- PHP: `^8.2`
- Authentication:
  - Laravel Sanctum bearer tokens for mobile API authentication
  - Laravel session auth for browser-based admin flows
- Frontend tooling inside Laravel:
  - Vite `^7.0.7`
  - Tailwind CSS `^4.0.0`
  - Sass `^1.87.0`
- Important packages:
  - `laravel/sanctum`
  - `kreait/laravel-firebase`
  - `anuzpandey/laravel-nepali-date`
- Current default data/runtime drivers from `.env.example`:
  - database: `sqlite`
  - sessions: `database`
  - cache: `database`
  - queue: `database`
- Route surfaces:
  - `routes/web.php`: browser-based admin pages and web actions
  - `routes/api.php`: mobile-facing API endpoints under `/api`
  - `routes/console.php`: scheduled jobs
- Scheduled job:
  - `SendRenewalReminders` runs daily at `08:00`
- Queue usage:
  - queued FCM notifications
  - queued renewal reminder delivery
- Payment integrations configured in `config/payment.php`:
  - Khalti
  - eSewa
  - ConnectIPS

### Mobile: `InsuranceMobileApp`

- Frameworks:
  - Ionic `^8.0.0`
  - Angular `^20.0.0`
  - Capacitor `8.1.0`
  - TypeScript `~5.9.0`
- Native/mobile capabilities:
  - Camera
  - Browser
  - Preferences
  - Push Notifications
- Current Android shell:
  - Capacitor `appId`: `io.ionic.starter`
  - Android `applicationId`: `io.ionic.starter`
- Web output:
  - Angular builds into `www/`
- API configuration:
  - `src/environments/environment.ts`
  - `src/environments/environment.prod.ts`

## 4. How The Two Projects Communicate

The mobile app communicates with the Laravel backend through HTTPS REST calls only.

- Base API path: `/api`
- Auth model: bearer token in `Authorization: Bearer {token}`
- Mobile base URL source: `InsuranceMobileApp/src/environments/environment*.ts`
- The backend exposes both public and authenticated mobile endpoints, including:
  - auth
  - geo data
  - enrollment
  - renewal
  - profile
  - notifications
  - subsidies
  - policy lookup
  - payment initiation and payment status

The browser-based admin panel does not use the mobile environment files. It is served directly by Laravel from the same deployment that serves the API.

## 5. Important Functional Modules

### Backend modules

- Auth:
  - mobile registration/login/logout/profile via API
  - browser login, password reset, profile management
- Enrollment:
  - multi-step enrollment workflow
  - family members
  - supporting documents
  - verification, approval, rejection
- Renewal:
  - policy search
  - review and member update
  - submission, verification, approval, rejection
  - scheduled reminders
- Subsidy:
  - eligibility checks
  - subsidy apply/approve/reject/revoke
  - audit log
- Policy and reporting:
  - beneficiary policy/payments
  - province policy views
  - reports
- Admin:
  - users
  - roles and permissions
  - health facilities
  - policy rules
- Payments:
  - payment creation
  - gateway callback handling
  - result bridge pages
- Notifications:
  - FCM token registration
  - unread counts
  - mark-as-read flows

### Core data domains

The backend revolves around these main records:

- users
- roles
- enrollments
- household_heads
- family_members
- enrollment_documents
- renewals
- renewal_histories
- renewal_reminders
- subsidies
- device_tokens
- notifications
- payments and payment references
- policy rules
- system configuration

## 6. Current Deployment-Sensitive Findings

These are the most important items to fix or account for before production deployment:

- Mobile API URL is still a LAN/development address in both environment files:
  - `http://192.168.254.20:8000/api`
- The mobile app package name is still the starter value:
  - Capacitor app id: `io.ionic.starter`
  - Android application id: `io.ionic.starter`
- Firebase push notifications require all of these to match:
  - Android package name
  - `google-services.json`
  - backend Firebase credentials
- Payment callbacks require a public HTTPS URL reachable by external gateways. A private LAN IP will not work.
- The backend default config is development-friendly, not production-friendly:
  - SQLite default database
  - database-backed cache
  - database-backed sessions
  - database-backed queue
- The backend includes a scheduled reminder job, so production must run both:
  - a persistent queue worker
  - the Laravel scheduler every minute
- The backend is a web app plus an API. Production must support both:
  - browser traffic for admin routes
  - API traffic for mobile routes
- A Firebase service account JSON exists locally in the repo root. In production it should be stored securely on the server outside the public web root and referenced through environment variables.

## 7. Recommended Production Topology

Recommended default for first production or pilot deployment:

- 1 x Ubuntu 24.04 LTS VPS
- 4 vCPU
- 8 GB RAM
- 120 GB to 160 GB NVMe SSD
- 1 static public IPv4 address
- daily provider snapshot backups

Run these services on the same server:

- Nginx
- PHP-FPM
- Composer
- Node.js 20 LTS
- MariaDB 10.11 or MySQL 8
- `systemd` queue worker service
- cron entry for Laravel scheduler
- Certbot for TLS certificates

Optional but not required on day one:

- Redis for cache, sessions, and queues
- a second VPS for database isolation
- object storage for uploaded files and backups

### Why this topology fits this repo

- The backend is one Laravel application, not microservices.
- The mobile app is not hosted as a server-side process.
- Admin usage and API traffic can reasonably live on one VPS for an initial rollout.
- Queue workload exists, but it is limited enough for a single worker on the same host at v1 scale.

## 8. Recommended Server Specs

Use the following production specification as the default recommendation.

### Minimum safe production spec

- CPU: 4 vCPU
- RAM: 8 GB
- Storage: 120 GB SSD
- OS: Ubuntu 24.04 LTS
- Database: MariaDB 10.11 on the same host
- Web server: Nginx
- PHP: PHP-FPM 8.2 or newer compatible release
- TLS: Let's Encrypt certificates

### Better buffer if usage grows faster

- CPU: 8 vCPU
- RAM: 16 GB
- Storage: 200 GB NVMe SSD
- Add Redis
- Keep DB backups off-server

### When to move beyond one VPS

Upgrade the architecture when one or more of these become true:

- heavy concurrent district/province-wide usage
- slow report generation affecting user traffic
- queue backlog grows during office hours
- database size or backup windows become uncomfortable
- uptime requirements call for high availability

At that point, split the stack into:

- app server or app servers
- separate managed MySQL/MariaDB
- Redis
- object storage
- optional load balancer

## 9. What Actually Runs On The Server

Only `InsuranceApp` needs to be deployed to the production server.

Server-side runtime responsibilities:

- serve Laravel web routes
- serve Laravel API routes
- process uploads
- execute queued jobs
- execute scheduled jobs
- connect to payment gateways
- connect to Firebase services
- connect to the production database

What does not run as a permanent server process:

- `InsuranceMobileApp`
- Android Studio
- Capacitor dev server
- local mobile build tooling

The mobile app should be built into an Android package and distributed to devices. Those devices talk to the backend over HTTPS.

## 10. Detailed Ubuntu Server Setup Guide

The steps below assume:

- domain: `insurance.example.gov.np`
- backend path: `/var/www/insurance/current`
- Linux deploy user: `deploy`
- PHP-FPM socket version: `php8.2-fpm` or compatible installed version

If Ubuntu 24.04 installs PHP 8.3 by default, that is acceptable because the project requires PHP `^8.2`.

### Step 1: Prepare DNS And Firewall

- Point your production domain to the VPS public IP.
- Open ports:
  - `22` for SSH
  - `80` for HTTP
  - `443` for HTTPS
- Do not expose MariaDB/MySQL publicly unless there is a very specific operational reason.

### Step 2: Install Base Packages

Example package install flow:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx git unzip curl mariadb-server certbot python3-certbot-nginx
sudo apt install -y php-fpm php-cli php-mysql php-sqlite3 php-mbstring php-xml php-curl php-zip php-intl php-bcmath php-gd php-fileinfo
```

Install Composer:

```bash
cd /tmp
curl -sS https://getcomposer.org/installer -o composer-setup.php
php composer-setup.php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

Install Node.js 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### Step 3: Create Deployment Directories

```bash
sudo mkdir -p /var/www/insurance
sudo mkdir -p /var/www/insurance/shared
sudo mkdir -p /var/www/insurance/releases
sudo useradd -m -s /bin/bash deploy || true
sudo chown -R deploy:www-data /var/www/insurance
sudo chmod -R 775 /var/www/insurance
```

Recommended shared items:

- environment file copy
- Firebase service account file
- uploaded backups if needed

### Step 4: Upload Or Clone The Laravel App

Deploy the `InsuranceApp` project into a release directory, then point `current` to it.

Example:

```bash
cd /var/www/insurance/releases
git clone <your-repository-url> app-2026-04-07
ln -sfn /var/www/insurance/releases/app-2026-04-07/InsuranceApp /var/www/insurance/current
```

If the repository checked out to `/var/www/insurance/current` directly, that is also acceptable for a simple deployment. The key requirement is that Nginx must serve the Laravel `public/` directory.

### Step 5: Create The Production Database

Recommended production choice:

- MariaDB 10.11 on the same VPS

Example setup:

```bash
sudo mysql
```

Then inside MariaDB:

```sql
CREATE DATABASE insurance_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'insurance_user'@'localhost' IDENTIFIED BY 'strong-password-here';
GRANT ALL PRIVILEGES ON insurance_app.* TO 'insurance_user'@'localhost';
FLUSH PRIVILEGES;
```

Why not SQLite in production:

- better concurrency
- easier backup discipline
- easier recovery and maintenance
- better fit for sessions, queue jobs, and future reporting load

### Step 6: Create The Production `.env`

Use a production `.env` inside `InsuranceApp`.

Recommended baseline:

```env
APP_NAME="Health Insurance Management System"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://insurance.example.gov.np

LOG_CHANNEL=stack
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=insurance_app
DB_USERNAME=insurance_user
DB_PASSWORD=strong-password-here

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

CACHE_STORE=database
QUEUE_CONNECTION=database

SANCTUM_STATEFUL_DOMAINS=insurance.example.gov.np

MAIL_MAILER=smtp
MAIL_HOST=your-mail-host
MAIL_PORT=587
MAIL_USERNAME=your-mail-user
MAIL_PASSWORD=your-mail-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@example.gov.np
MAIL_FROM_NAME="Health Insurance Management System"

FIREBASE_CREDENTIALS=/var/www/insurance/shared/firebase-service-account.json

PAYMENT_SANDBOX=false
PAYMENT_CALLBACK_BASE_URL=https://insurance.example.gov.np/api/payments/callback

KHALTI_SECRET_KEY=your-khalti-secret
ESEWA_MERCHANT_CODE=your-esewa-merchant
ESEWA_SECRET_KEY=your-esewa-secret
IPS_MERCHANT_ID=your-connectips-merchant
IPS_APP_ID=your-connectips-app-id
IPS_APP_NAME=InsuranceApp
IPS_SECRET_KEY=your-connectips-secret
```

Notes:

- `APP_URL` must be the public HTTPS URL.
- `PAYMENT_CALLBACK_BASE_URL` must be public and reachable by the payment providers.
- Keep Firebase credentials outside `public/`.
- `SESSION_DRIVER=database` and `QUEUE_CONNECTION=database` match the app's existing structure and are fine for v1.
- If you later add Redis, migrate cache/sessions/queue there for better performance.

### Step 7: Install Dependencies And Build Assets

Run these inside `C:\Insurance\InsuranceApp` equivalent on the Linux server, for example `/var/www/insurance/current`.

```bash
cd /var/www/insurance/current
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Only run `db:seed --force` if your production rollout requires the seeded roles, rules, and system config. In this project, that is likely needed for a first deployment because the app depends on base roles, policy rules, and system configuration.

### Step 8: Set File Ownership And Writable Permissions

Laravel must be able to write to:

- `storage/`
- `bootstrap/cache/`

Example:

```bash
sudo chown -R deploy:www-data /var/www/insurance/current
sudo find /var/www/insurance/current -type f -exec chmod 664 {} \;
sudo find /var/www/insurance/current -type d -exec chmod 775 {} \;
sudo chown -R www-data:www-data /var/www/insurance/current/storage
sudo chown -R www-data:www-data /var/www/insurance/current/bootstrap/cache
```

### Step 9: Configure Nginx

Example site config:

```nginx
server {
    listen 80;
    server_name insurance.example.gov.np;
    root /var/www/insurance/current/public;
    index index.php index.html;

    client_max_body_size 20M;

    access_log /var/log/nginx/insurance_access.log;
    error_log /var/log/nginx/insurance_error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/insurance /etc/nginx/sites-enabled/insurance
sudo nginx -t
sudo systemctl reload nginx
```

If your server uses PHP 8.3, update the socket path accordingly.

### Step 10: Enable HTTPS

```bash
sudo certbot --nginx -d insurance.example.gov.np
```

After HTTPS is enabled:

- confirm redirects from HTTP to HTTPS
- confirm `APP_URL` stays HTTPS
- confirm payment callback URLs use HTTPS
- update the mobile app `apiUrl` to the same public HTTPS endpoint

### Step 11: Run The Queue Worker With `systemd`

Create `/etc/systemd/system/insurance-queue.service`:

```ini
[Unit]
Description=Insurance Laravel Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/insurance/current/artisan queue:work --sleep=3 --tries=1 --timeout=120
WorkingDirectory=/var/www/insurance/current
StandardOutput=append:/var/log/insurance-queue.log
StandardError=append:/var/log/insurance-queue-error.log

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable insurance-queue
sudo systemctl start insurance-queue
sudo systemctl status insurance-queue
```

Why this is required:

- FCM delivery jobs implement `ShouldQueue`
- renewal reminder jobs are scheduled and queued

### Step 12: Run Laravel Scheduler Every Minute

Add a cron entry:

```bash
* * * * * cd /var/www/insurance/current && php artisan schedule:run >> /dev/null 2>&1
```

Why this is required:

- `routes/console.php` schedules `SendRenewalReminders` daily at `08:00`
- without the scheduler cron, reminders never run in production

### Step 13: Backups

Minimum backup policy:

- daily database dump
- daily VPS snapshot
- keep at least 7 daily backups
- keep at least 4 weekly backups if possible

Suggested database backup command:

```bash
mysqldump -u insurance_user -p insurance_app > /var/www/insurance/shared/backups/insurance_app_$(date +%F).sql
```

Also back up:

- `.env`
- Firebase credentials file
- uploaded files inside `storage/app` if business records depend on them

### Step 14: Monitoring And Operations

Watch these areas after go-live:

- Nginx access and error logs
- Laravel logs in `storage/logs`
- queue worker status
- failed jobs table
- disk usage for uploads and logs
- MariaDB growth and slow queries
- payment callback failures
- FCM token registration and notification delivery behavior

## 11. Deployment Commands Checklist

This is the short operational command set for a production deployment:

```bash
cd /var/www/insurance/current
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo systemctl restart insurance-queue
sudo systemctl reload nginx
```

Useful verification commands:

```bash
php artisan about
php artisan route:list
php artisan queue:failed
php artisan schedule:list
systemctl status insurance-queue
curl -I https://insurance.example.gov.np
curl https://insurance.example.gov.np/api
```

## 12. Mobile Release Checklist

Before publishing the Android app:

- replace `apiUrl` in both of these files:
  - `InsuranceMobileApp/src/environments/environment.ts`
  - `InsuranceMobileApp/src/environments/environment.prod.ts`
- use the real public HTTPS backend URL, for example:
  - `https://insurance.example.gov.np/api`
- change the Capacitor/Android app id from `io.ionic.starter` to the final organization package name
- align the final package name with Firebase
- replace `google-services.json` if the Firebase project changes
- test payment redirects and return handling against the public backend
- test push token registration and notification receipt on a physical Android device

Android release flow:

```bash
cd /path/to/InsuranceMobileApp
npm install
npm run build
npx cap sync android
```

Then:

- open the Android project in Android Studio
- create a signed `AAB` for Play Store distribution or a signed `APK` for direct distribution
- test login, enrollment, renewal, upload, payment, and push notifications against production or staging API

## 13. Acceptance Checklist For Production Readiness

The deployment is not complete until all of the following are true:

- Laravel web admin loads over HTTPS
- `/api` returns an OK response
- login works from the mobile app against the public domain
- payment callback URL is public and HTTPS
- database migrations are applied
- queue worker is running continuously
- Laravel scheduler cron is installed
- storage symlink exists
- Firebase credentials are configured correctly
- mobile `apiUrl` points to the public domain, not a LAN IP
- Android package name and Firebase package name match

## 14. Assumptions And Defaults

This document uses these working assumptions:

- production target is a first production or pilot rollout
- one Ubuntu VPS is the preferred initial deployment shape
- MariaDB/MySQL is preferred over SQLite in production
- Redis is optional for v1 and can be added later
- the mobile app is Android-first and does not need web hosting for end users
- this file is the shared source of truth and should remain synchronized in:
  - `C:\Insurance\PROJECT_CONTEXT.md`
  - `C:\Insurance\InsuranceApp\PROJECT_CONTEXT.md`
  - `C:\Insurance\InsuranceMobileApp\PROJECT_CONTEXT.md`

## 15. Quick Answer To "What Server Do I Need?"

Use this unless you have a stronger scaling requirement right now:

- 1 Ubuntu 24.04 VPS
- 4 vCPU
- 8 GB RAM
- 120 GB to 160 GB NVMe SSD
- static public IP
- Nginx
- PHP-FPM
- MariaDB 10.11
- Node.js 20 LTS
- Composer
- Certbot
- one `systemd` queue worker
- one cron entry for Laravel scheduler

That is the correct first-production setup for this repo.
