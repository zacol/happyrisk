module.exports = {
  '**/*.{ts,tsx}': ['eslint --flag unstable_config_lookup_from_file --fix'],
  '**/*.{ts,tsx,js,mjs,json,md,css}': ['prettier --write'],
};
