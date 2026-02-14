# Kontrol

**Estate access management made simple.**

Kontrol is a modern, multi-tenant SaaS platform for managing gated communities and residential estates. It streamlines visitor access, resident management, and community communication.

**Live at [usekontrol.com](https://usekontrol.com)**

## Features

### For Residents

- **Visitor Access Codes** - Generate time-limited codes for guests, deliveries, and service providers
- **Real-time Notifications** - Get instant alerts when visitors arrive via push notifications or Telegram
- **Activity Feed** - Track all visitor entries and access code usage
- **Community Board** - Stay connected with estate announcements and discussions
- **PWA Support** - Install as a native-like app on mobile devices

### For Security Personnel

- **Code Verification** - Quickly validate visitor access codes at the gate
- **Access Logging** - Automatic logging of all entry/exit events
- **Visitor Management** - View expected visitors and their details

### For Estate Administrators

- **Resident Management** - Add, invite, and manage residents
- **Security Personnel** - Manage security staff and their permissions
- **Role-Based Access Control** - Create custom roles with granular permissions
- **Estate Board** - Post announcements and updates for residents
- **Activity Logs** - Comprehensive audit trail of all system activities
- **Configurable Settings** - Customize access code policies and estate preferences

## Tech Stack

- **Backend:** Laravel 12, PHP 8.5
- **Frontend:** React 19, Inertia.js v2, Tailwind CSS v4
- **Database:** MySQL
- **Real-time:** Laravel Reverb (WebSockets)
- **Authentication:** Laravel Sanctum, Google OAuth (Socialite)
- **Notifications:** Push Notifications, Telegram Bot
- **Testing:** Pest v4
- **Code Quality:** Laravel Pint, ESLint, Prettier

## Requirements

- PHP 8.3+
- Node.js 20+
- MySQL 8.0+
- Composer 2.x
- npm or yarn

## Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/your-org/kontrol.git
    cd kontrol
    ```

2. **Install PHP dependencies**

    ```bash
    composer install
    ```

3. **Install Node dependencies**

    ```bash
    npm install
    ```

4. **Environment setup**

    ```bash
    cp .env.example .env
    php artisan key:generate
    ```

5. **Configure your `.env` file**

    ```env
    DB_CONNECTION=mysql
    DB_DATABASE=kontrol
    DB_USERNAME=your_username
    DB_PASSWORD=your_password

    # Google OAuth (optional)
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"

    # Telegram Bot (optional)
    TELEGRAM_BOT_TOKEN=
    TELEGRAM_BOT_USERNAME=
    ```

6. **Run migrations and seeders**

    ```bash
    php artisan migrate --seed
    ```

7. **Build frontend assets**

    ```bash
    npm run build
    ```

8. **Start the development server**

    ```bash
    # Option 1: Using Laravel's built-in server
    php artisan serve

    # Option 2: Using the dev script (includes Vite and Reverb)
    composer run dev
    ```

## Development

### Running the development environment

```bash
# Start all services (Laravel, Vite, Reverb)
composer run dev

# Or run individually:
php artisan serve          # Laravel server
npm run dev                # Vite dev server
php artisan reverb:start   # WebSocket server
```

### Code formatting

```bash
# PHP (Pint)
vendor/bin/pint

# JavaScript/TypeScript (Prettier + ESLint)
npm run format
npm run lint
```

### Running tests

```bash
# All tests
php artisan test

# With coverage
php artisan test --coverage

# Specific test
php artisan test --filter=TestName
```

### Generating TypeScript routes (Wayfinder)

```bash
php artisan wayfinder:generate
```

## Multi-Tenancy

Kontrol uses a single-database multi-tenant architecture with `estate_id` scoping:

- All queries are automatically scoped to the current estate
- Users can belong to multiple estates
- Roles and permissions are estate-specific

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@usekontrol.com or visit [usekontrol.com](https://usekontrol.com).
