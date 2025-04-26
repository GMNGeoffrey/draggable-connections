export default {
    ignoreFiles: [
        'package.json',
        'package-lock.json',
        'yarn.lock',
        '*.code-workspace',
        'bookmarklet',
        'README.md', // This is the README for the GitHub project, not the extension
        '*.mjs',
    ],
    sign: {
        "amoMetadata": "amo-metadata.json",
        "channel": "listed"
    }
};
