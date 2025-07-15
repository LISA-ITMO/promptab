#!/bin/bash

# Build documentation for PrompTab Backend
# This script builds Sphinx documentation and prepares it for GitHub Pages

set -e  # Exit on any error

echo "🚀 Starting documentation build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docs/conf.py" ]; then
    print_error "conf.py not found. Please run this script from the backend directory."
    exit 1
fi

# Create necessary directories
print_status "Creating build directories..."
mkdir -p docs/_build/html
mkdir -p docs/_build/doctrees
mkdir -p docs/_static

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf docs/_build/html/*
rm -rf docs/_build/doctrees/*

# Check if sphinx-build is available
if ! command -v sphinx-build &> /dev/null; then
    print_error "sphinx-build not found. Please install Sphinx: pip install sphinx"
    exit 1
fi

# Build HTML documentation
print_status "Building HTML documentation..."
cd docs

# Run sphinx-build with verbose output
sphinx-build -b html -d _build/doctrees . _build/html

# Check if build was successful
if [ $? -eq 0 ]; then
    print_status "✅ HTML documentation built successfully!"
else
    print_error "❌ Failed to build HTML documentation"
    exit 1
fi

# Create .nojekyll file for GitHub Pages
print_status "Creating .nojekyll file for GitHub Pages..."
touch _build/html/.nojekyll

# Create CNAME file if it exists in the source
if [ -f "CNAME" ]; then
    print_status "Copying CNAME file..."
    cp CNAME _build/html/
fi

# Copy custom static files
if [ -d "_static" ]; then
    print_status "Copying custom static files..."
    cp -r _static/* _build/html/_static/ 2>/dev/null || true
fi

# Generate sitemap for better SEO
print_status "Generating sitemap..."
cat > _build/html/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://LISA-ITMO.github.io/promptab/</loc>
    <lastmod>$(date -u +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
EOF

# Create robots.txt
print_status "Creating robots.txt..."
cat > _build/html/robots.txt << EOF
User-agent: *
Allow: /

Sitemap: https://LISA-ITMO.github.io/promptab/sitemap.xml
EOF

# Check for common issues
print_status "Checking for common issues..."

# Check for broken links (if linkchecker is available)
if command -v linkchecker &> /dev/null; then
    print_status "Checking for broken links..."
    linkchecker --check-extern --no-robots _build/html/index.html || print_warning "Some external links may be broken"
else
    print_warning "linkchecker not found. Install with: pip install linkchecker"
fi

# Check file sizes
print_status "Checking build output..."
BUILD_SIZE=$(du -sh _build/html | cut -f1)
print_status "Build size: $BUILD_SIZE"

# Count HTML files
HTML_COUNT=$(find _build/html -name "*.html" | wc -l)
print_status "Generated $HTML_COUNT HTML files"

# List main files
print_status "Main documentation files:"
ls -la _build/html/*.html 2>/dev/null || print_warning "No HTML files found"

cd ..

# Create a simple index redirect if needed
if [ ! -f "docs/_build/html/index.html" ]; then
    print_warning "No index.html found, creating redirect..."
    cat > docs/_build/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PrompTab Backend Documentation</title>
    <meta http-equiv="refresh" content="0; url=./index.html">
</head>
<body>
    <p>Redirecting to <a href="./index.html">documentation</a>...</p>
</body>
</html>
EOF
fi

print_status "🎉 Documentation build completed successfully!"
print_status "📁 Output directory: docs/_build/html/"
print_status "🌐 To view locally: cd docs/_build/html && python -m http.server 8000"

# Show next steps
echo ""
echo "📋 Next steps:"
echo "1. Commit and push your changes to trigger GitHub Actions"
echo "2. Enable GitHub Pages in your repository settings"
echo "3. Set source to 'gh-pages' branch"
echo "4. Your docs will be available at: https://LISA-ITMO.github.io/promptab/"

exit 0 