# Milabi Global — WhatsApp Storefront

A lightweight static storefront where every order is confirmed on WhatsApp.

## Files
- `index.html` — homepage (categories + featured products)
- `categories.html` — full category directory
- `category.html` — single category page (uses `?slug=`)
- `product.html` — single product page (uses `?slug=`)
- `cart.html` — local cart with **Confirm on WhatsApp** button
- `styles.css`, `app.js` — original styling and logic
- `catalog.json` — **edit this file** to add your categories and products
- `robots.txt`, `sitemap.xml` — SEO files
- `build_sitemap.py` — regenerates `sitemap.xml` from `catalog.json`

## WhatsApp number
Hard‑coded everywhere as **0737473583** (international: +254737473583).
- **Buy Now** → opens `https://wa.me/254737473583` with a prefilled message containing the product name, quantity and price.
- **Add to Cart** → stores the item locally; the cart page has a **Confirm on WhatsApp** button that sends the full order summary.
- A floating WhatsApp bubble is on every page.
- The header, footer, and contact links all point to 0737473583.

To change the number, edit the two constants at the top of `app.js`
(`WHATSAPP_NUMBER`, `WHATSAPP_DISPLAY`) and the footer link in each HTML file.

## Adding products
Open `catalog.json` and add objects to `categories` and `products`. Schema:

```json
{
  "categories": [
    { "slug": "perfume", "name": "Perfumes", "emoji": "🌸" }
  ],
  "products": [
    {
      "slug": "my-product",
      "name": "My Product Name",
      "price": 1500,
      "old_price": 3000,
      "image": "https://your-cdn.example.com/path.jpg",
      "category": "perfume",
      "description": "Optional long description."
    }
  ]
}
```

- `slug` must be URL‑safe and unique.
- `category` must match a category `slug`.
- `image` should be a full https URL to an image you own/host.
- `old_price` is optional; if present and greater than `price`, a discount badge is shown.

## Refresh the sitemap

```bash
python3 build_sitemap.py https://yourdomain.com
```

## Hosting
Drop the folder on any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, Nginx). No build step required.

## What this is NOT
This is a clean, original framework. It does **not** ship with any third‑party catalog content. Add only products, names, descriptions and images that you own or have rights to use.
