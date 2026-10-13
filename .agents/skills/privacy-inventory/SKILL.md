---
name: privacy-inventory
description: Builds a non-technical Word (.docx) inventory of the personal data, emails, third parties, retention and cookies a website actually handles, read from its code, so the client's legal department can write the Privacy and Cookie policies. Use when asked for a "privacy inventory", "inventário de dados", "inventario de datos para legal", "what does the site store for the privacy/cookie policy", or to refresh that document after features change.
---

# Privacy & cookie inventory for the legal department

The client is the data controller and their lawyers write the policies. Our job is to hand them **facts from the code** in plain language. Never write the legal text itself.

## Before starting

Settle these points. Ask only what the repo and the conversation do not already answer:

- **Site name:** from `APP_NAME`, `package.json` or the README.
- **Document language:** the legal team's language. Default to **pt-PT** for Portuguese clients and the user's language otherwise.
- **Production facts the code cannot show:** log rotation, hosting provider, email provider. If they are unknown, write them as "a completar" and do not guess.

## Output

- One `.docx` at the repo root, named `Inventario-dados-pessoais-cookies-<SiteName>.docx` (translate the name if the document is not in Portuguese). Do not commit it unless asked.
- Plain language for non-programmers. No class names, table names or file paths. The only code-like strings allowed are cookie names.
- Facts only. Anything you cannot verify from the code (production providers, a payment widget's own cookies) is marked "a completar" or "a confirmar com X".
- Date the document ("Situação do site a …").

## Step 1: Gather facts from the code

Adapt the paths to the stack. The hints below are for Laravel. For other stacks, look for the equivalents: schema or migrations, forms, mailers, cron jobs, the cookie and session config, and third-party scripts.

| Topic | Where to look (Laravel) |
| --- | --- |
| Personal data stored | `database/migrations/*`: every column that identifies a person (names, emails, phones, addresses, IPs, user agents, tax IDs, free-text notes) |
| How data is collected | Registration, checkout, contact and profile forms (Livewire, Filament panels, controllers, Form Requests); admin-created accounts |
| Payment gateway | `app/Services/Payments/*` or the equivalent: which customer fields are sent to the gateway, and whether card data ever reaches our server |
| Emails sent | `app/Notifications/*`, `app/Mail/*`, `app/Console/Commands/*`, `routes/console.php` (schedule). Classify each one as service or commercial (abandoned cart, newsletter, promotions) and check for an unsubscribe link |
| Automatic deletion | `Prunable` models, `SESSION_LIFETIME`, `auth.passwords.*.expire`, soft deletes (the data is hidden, not deleted) |
| Logs | `LOG_STACK` / `LOG_DAILY_DAYS`. `single` means the log is never deleted. Confirm the production value with the user |
| Cookies | `php artisan config:show session.cookie`, `XSRF-TOKEN`, the remember-me cookie `remember_web_…` (400 days, only when "remember me" is ticked), plus any cookie set in app code. Check `localStorage` use too (Filament stores the theme there) |
| External requests from the browser | `grep -rnoE "https?://" resources/views resources/js`, `vite.config.js` (fonts: self-hosted or loaded from Google), `package.json` (analytics, pixels, YouTube or map embeds, chat widgets, reCAPTCHA) |
| Features present but not public | Components or views that no page uses yet (for example product reviews) |
| User rights in the UI | Profile edit, address delete, account deletion, data export, email unsubscribe |
| Compliance gaps to flag | Missing tax ID field, no terms or privacy acceptance checkbox, placeholder contact details, commercial emails without unsubscribe, data with no retention limit |

## Step 2: Document structure

Headings below are in pt-PT. Translate them if the document uses another language.

1. Summary note listing what is **not** used: analytics, pixels, newsletter, card data.
2. **Que dados são recolhidos e para quê.** One subsection per context: account, addresses, orders, payments, cart and wishlist, technical visit data, features not active yet. End with a "Não é recolhido" note.
3. **Emails enviados ao cliente.** Table: Email, Quando, Tipo (Serviço/Comercial).
4. **Com quem os dados são partilhados.** Table: Destinatário, O que recebe, Para quê.
5. **Durante quanto tempo são conservados.** Table separating what is deleted automatically from what has no limit ("sem prazo").
6. **O que o cliente pode fazer por si próprio.** Table of GDPR rights, saying which ones the UI offers.
7. **Cookies e armazenamento no navegador.** Table: Nome, Próprio/terceiros, Finalidade, Duração. Say explicitly whether a consent banner is needed. It is needed only if non-essential cookies exist.
8. **Informação necessária do departamento jurídico.** Numbered list of open decisions: controller details and DPO, retention periods, legal basis for commercial emails, providers and non-EU transfers, tax ID, acceptance checkbox, procedure for rights requests.

Put every open decision in a highlighted "Pendente de decisão jurídica" note.

## Step 3: Generate the .docx

1. Load the docx skill (`anthropic-skills:docx`).
2. Start from `scripts/build-docx.js` in this skill. It holds a complete example for a sample shop. Keep its helpers and styles: bold through `**…**`, shaded notes, DXA tables with a header row, page number in the footer. Set `SITE_NAME` and replace the `body` array with the new content.
3. If `require('docx')` fails, install it in the session scratchpad (`npm init -y && npm install docx@9.5.0`), copy the script there and run `node build-docx.js <output path>`.
4. Verify the output:
   - If LibreOffice and pdftoppm are available, render the document and look at it.
   - If they are not, check that every XML part parses (python `zipfile` + `minidom`) and print the extracted text. Then tell the user the document could not be checked visually.

## Step 4: Report back

Give the user:
- the file path,
- the list of open legal decisions,
- the facts that could not be verified from the code.

If they ask for another language, or for just one changed section, give it in chat.