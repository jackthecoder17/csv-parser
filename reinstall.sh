#!/bin/bash

# Remove node_modules and package-lock.json
rm -rf node_modules
rm -rf package-lock.json

# Reinstall dependencies
npm install

# Explicitly install autoprefixer
npm install --save-dev autoprefixer@latest postcss@latest tailwindcss@latest
