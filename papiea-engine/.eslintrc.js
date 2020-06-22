module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'airbnb-typescript/base'
    ],
    rules: {
        "@typescript-eslint/quotes": [
            2,
            "double"
        ],
        "@typescript-eslint/semi": [2, "never"],
        // "variable-name": {
        //     "options": [
        //         "check-format",
        //         "allow-pascal-case",
        //         "allow-snake-case",
        //         "allow-leading-underscore"
        //     ]
        // },
        "@typescript-eslint/object-shorthand-properties-first": 0,
        "@typescript-eslint/indent": [
            2,
            4,
            {"SwitchCase": 1}
        ],
        "no-console": [0],
        "no-var-requires": 0,
        "ter-arrow-parens": [2, "as-needed"],
        "no-shadowed-variable": 0,
        "max-classes-per-file": [0, 1]
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
};
