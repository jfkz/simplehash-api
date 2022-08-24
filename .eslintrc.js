module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "extends": [
        "prettier",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "@typescript-eslint/quotes": ["error", "single"],
    },
    "ignorePatterns": [
        "node_modules",
        "**/vendor/*.js",
        ".eslintrc.js",
    ]
}
