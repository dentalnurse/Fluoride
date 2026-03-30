# DNT — Certificate in Fluoride Varnish Application

Website for the DNT Certificate in Fluoride Varnish Application, delivered by Em Bremner of DNT — Dental Nurse Training.

## Hosting on GitHub Pages

1. Create a new repository on GitHub (e.g. `dental-fva` or `fluoride-certificate`)
2. Upload all files in this folder, maintaining the folder structure:
   ```
   index.html
   _config.yml
   css/main.css
   js/main.js
   pages/
     course.html
     handbook.html
     portfolio.html
     documents.html
     enrol.html
   ```
3. Go to **Settings → Pages** in your GitHub repository
4. Under **Source**, select `main` branch and `/ (root)` folder
5. Save — your site will be live at `https://yourusername.github.io/repo-name/`

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home / landing page |
| `pages/course.html` | Course overview |
| `pages/handbook.html` | Interactive presentation handbook (all 3 modules, 27 slides) |
| `pages/portfolio.html` | Portfolio of evidence explainer |
| `pages/documents.html` | Document pack overview |
| `pages/enrol.html` | Enquiry form |

## Handbook

The handbook (`pages/handbook.html`) is a self-contained click-through presentation with:
- 27 slides across 3 modules + cover and end slide
- Sidebar navigation with module/section links
- Keyboard navigation (arrow keys)
- Progress bar
- Mobile-responsive with sidebar toggle

## Customisation

- **Colours**: Edit CSS variables in `css/main.css` under `:root`
- **Contact**: Update the enquiry form action in `pages/enrol.html` to connect to a form service (e.g. Formspree, Netlify Forms)
- **Cost/timeframe**: Update `pages/course.html` info card and `index.html` once confirmed
- **Logo/branding**: The DNT initials and name are in the nav across all pages

## Built by

DNT — Dental Nurse Training | dentalnurse.training
