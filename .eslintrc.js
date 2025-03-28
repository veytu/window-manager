/** @type {import("eslint").Linter.Config */
const config = {
    root: true,
    env: {
        browser: true,
    },
    parser: "@typescript-eslint/parser",
    plugins: ["svelte3", "@typescript-eslint"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
    rules: {
        "@typescript-eslint/consistent-type-imports": ["warn"],
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                argsIgnorePattern: "^_",
            },
        ],
        "@typescript-eslint/ban-types": [
            "error",
            {
                types: { "{}": false },
                extendDefaults: true,
            },
        ],
        "no-extra-boolean-cast": false
    },
    overrides: [
        {
            files: ["*.svelte"],
            processor: "svelte3/svelte3",
        },
    ],
    settings: {
        "svelte3/typescript": true,
    },
};

// eslint-disable-next-line no-undef
module.exports = config;
