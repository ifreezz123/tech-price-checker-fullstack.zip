# Tech Supplies Price Checker

A full-stack Matrix-style price checker for technology supplies.

## Features

- Matrix animated background
- Product search through backend API
- SQLite product database
- Pagination
- Sorting
- Category filtering
- Debounced frontend search
- Backend in-memory cache
- Loading and error states
- Price refresh job structure
- Provider adapter placeholders for real retailer APIs

## Run locally

```bash
npm install
npm run init-db
npm start
```

Open:

```text
http://localhost:3000
```

## Development mode

```bash
npm install
npm run init-db
npm run dev
```

## API

Search products:

```text
GET /api/products?q=laptop&category=Laptop&sort=price-low&page=1&limit=10
```

Categories:

```text
GET /api/categories
```

Manual price refresh:

```text
POST /api/admin/refresh-prices
```

## Important

The included providers are safe demo providers. To use real prices, connect official retailer or affiliate APIs in:

```text
src/providers/
```

Do not scrape major retailers unless their terms allow it.
