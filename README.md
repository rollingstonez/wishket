# ATELIER SEOUL — Gallery website concept

Korean-first gallery website and curator dashboard. This codebase is a separate project from Imweb; it does not change the existing Imweb site or its built-in admin.

## Run locally

Serve this folder over HTTP (ES modules do not run reliably from `file://`), then open `/index.html` or `/admin.html`. For example:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/`. Without Supabase settings, content changes are saved in this browser's local storage.

## Connect a remote content store

1. Create a Supabase project and run `supabase/migrations/001_gallery_content.sql` in its SQL editor.
2. Put the project URL and public anon/publishable key in `config.js`.
3. Create a curator account in Supabase Auth. Grant the user `app_metadata.role = curator` using a trusted server or Supabase dashboard; never put a service role key in browser code.
4. Reload the site and sign in from the admin page. Published content is publicly readable; editing requires a curator account.

`config.js` only accepts the public key. RLS policies in the migration protect write access. Keep the curator role assignment outside the browser.

## Included

- Responsive gallery homepage, exhibition listings, artist profiles, and searchable artwork archive
- Admin CRUD and publish controls for exhibitions, artists, and artworks
- Browser local storage fallback and optional Supabase persistence/authentication
- Artwork forms have no price or shipping fields
- Illustrative seed content that should be replaced with the gallery's actual identity and works

## Visual references

- [Tina Kim Gallery](https://tinakimgallery.com/ko/)
- [Thaddaeus Ropac](https://ropac.net/ko/about/)
- [BB&M Gallery](https://www.gallerybbm.com/ko/)
- [Gallery KICHE](https://www.gallerykiche.com/)
