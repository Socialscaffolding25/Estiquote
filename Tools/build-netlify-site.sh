#!/usr/bin/env bash

set -euo pipefail

dist=".netlify-dist"

mkdir -p "$dist/Brand" "$dist/css" "$dist/js"

cp index.html support.html privacy.html terms.html robots.txt sitemap.xml sw.js "$dist/"
cp css/site.css "$dist/css/site.css"
cp css/guides.css "$dist/css/guides.css"
mkdir -p "$dist/guides"
cp -R guides/. "$dist/guides/"
mkdir -p "$dist/about" "$dist/for-trades"
cp about/index.html "$dist/about/index.html"
cp for-trades/index.html "$dist/for-trades/index.html"
cp js/retire-legacy-pwa.js "$dist/js/retire-legacy-pwa.js"
cp Brand/Web-AppIcon.png "$dist/Brand/Web-AppIcon.png"
cp Brand/Web-Home.png "$dist/Brand/Web-Home.png"
cp Brand/Web-Project-Pass.png "$dist/Brand/Web-Project-Pass.png"
cp Brand/Download_on_the_App_Store_Badge.svg "$dist/Brand/Download_on_the_App_Store_Badge.svg"

echo "Built Estiquote website in $dist"
