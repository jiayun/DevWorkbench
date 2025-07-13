# DevWorkbench Documentation

This directory contains the GitHub Pages documentation for DevWorkbench.

## Structure

- `index.md` - Home page
- `features.md` - Features showcase
- `installation.md` - Installation guide  
- `development.md` - Development guide
- `_config.yml` - Jekyll configuration
- `_layouts/` - Page templates
- `assets/` - Styles and images

## Adding Screenshots

Replace the placeholder images in `assets/images/` with actual screenshots:

### Hero Image
- Location: `assets/images/hero/devworkbench-hero.png`
- Recommended size: 1200x675px
- Shows the main application interface

### Feature Screenshots
Replace each placeholder in `assets/images/features/`:
- `number-base-converter.png`
- `base64-encoder.png`
- `base58-encoder.png`
- `multiline-json.png`
- `hash-generator.png`
- `json-formatter.png`
- `uuid-generator.png`
- `jwt-tool.png`
- `url-tools.png`
- `text-utilities.png`
- `unix-time.png`
- `cron-parser.png`

Recommended size: 800x450px

## Local Development

To preview the site locally:

```bash
# Install Jekyll
gem install bundler jekyll

# Navigate to docs directory
cd docs

# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve
```

Visit http://localhost:4000/DevWorkbench to see the site.

## Deployment

1. Enable GitHub Pages in repository settings
2. Set source to `/docs` folder
3. The site will be available at: https://jiayun.github.io/DevWorkbench
