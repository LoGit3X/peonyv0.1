# Peony Cafe System

A cafe management system built with Node.js, Express, and React.

## Prerequisites

- Node.js (v16 or newer)

## Setup with SQLite (Recommended)

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

3. Set up SQLite database:
   ```
   npm run setup:sqlite
   ```

4. Start the application:
   ```
   npm run dev
   ```

The application will be available at http://localhost:3000

## PostgreSQL Setup (Optional)

If you prefer to use PostgreSQL:

1. Install PostgreSQL and make sure it's running on port 5432
2. Create a database named "peony_cafe"
   ```sql
   CREATE DATABASE peony_cafe;
   ```
3. Configure environment variables:
   - Update the `.env` file in the root directory:
   ```
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/peony_cafe
   NODE_ENV=development
   USE_SQLITE=false
   ```
4. Push database schema:
   ```
   npm run db:push
   ```
5. Start the application:
   ```
   npm run dev
   ```

## Building for Production

Build the application:
```
npm run build
```

Start the production server:
```
npm start
```

# Peony Cafe Admin

Admin panel for Peony Cafe.

## Features

- Inventory Management
- Recipe Management (with image upload)
- Sales and Order Tracking
- Reports and Analytics

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Setup the database:
   ```
   npm run setup
   ```

3. Run database migrations:
   ```
   node scripts/run-image-migration.js
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Image Upload Feature

The recipe management system now includes image upload capabilities:

- Upload images for recipe items
- Preview images in both edit mode and in the recipe list
- Delete images when no longer needed
- Images are stored in the `attached_assets/recipe_images` directory and served via a static middleware
- Images are automatically cleaned up when a recipe is deleted

### Technical Details

- Images are stored in the database as relative paths
- Maximum image size is 5MB
- Supported formats: JPG, PNG, GIF, WebP
- Images can be deleted separately from the recipe itself 