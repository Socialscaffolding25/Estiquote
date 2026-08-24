#!/usr/bin/env bash

set -euo pipefail

dist=".netlify-dist"

mkdir -p "$dist/Brand" "$dist/css" "$dist/js"

cp index.html support.html privacy.html terms.html robots.txt sitemap.xml sw.js "$dist/"
cp css/site.css "$dist/css/site.css"
cp js/retire-legacy-pwa.js "$dist/js/retire-legacy-pwa.js"
cp Brand/Web-AppIcon.png "$dist/Brand/Web-AppIcon.png"
cp Brand/Web-Home.png "$dist/Brand/Web-Home.png"
cp Brand/Web-Project-Pass.png "$dist/Brand/Web-Project-Pass.png"

echo "Built Estiquote website in $dist"
