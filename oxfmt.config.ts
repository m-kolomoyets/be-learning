import { defineConfig } from 'oxfmt';

export default defineConfig({
    $schema: './node_modules/oxfmt/configuration_schema.json',
    printWidth: 120,
    tabWidth: 4,
    singleQuote: true,
    arrowParens: 'always',
    trailingComma: 'es5',
    endOfLine: 'lf',
    proseWrap: 'never',
    sortPackageJson: false,
    ignorePatterns: [
        'node_modules/**',
        'dist/**',
        'tmp/**',
        'src/routeTree.gen.ts',
        'public/mockServiceWorker.js',
        'pnpm-lock.yaml',
    ],
    sortImports: {
        newlinesBetween: false,
        sortSideEffects: false,
        customGroups: [
            {
                groupName: 'type-react',
                selector: 'type',
                elementNamePattern: ['react', 'react-dom', 'react-dom/**'],
            },
            {
                groupName: 'value-react',
                modifiers: ['value'],
                elementNamePattern: ['react', 'react-dom', 'react-dom/**'],
            },
            { groupName: 'internal-lib', modifiers: ['value'], elementNamePattern: ['@/lib', '@/lib/**'] },
            {
                groupName: 'internal-hooks-context',
                modifiers: ['value'],
                elementNamePattern: ['@/hooks', '@/hooks/**', '@/context', '@/context/**'],
            },
            {
                groupName: 'internal-services',
                modifiers: ['value'],
                elementNamePattern: ['@/services', '@/services/**'],
            },
            {
                groupName: 'internal-modules',
                modifiers: ['value'],
                elementNamePattern: ['@/modules', '@/modules/**'],
            },
            {
                groupName: 'internal-components',
                modifiers: ['value'],
                elementNamePattern: ['@/components', '@/components/**'],
            },
            { groupName: 'internal-other', modifiers: ['value'], elementNamePattern: ['@/**'] },
        ],
        groups: [
            'type-react',
            ['type-external', 'type-builtin', 'type-subpath'],
            'type-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            'value-react',
            'value-builtin',
            'value-external',
            'internal-lib',
            'internal-hooks-context',
            'internal-services',
            'internal-modules',
            'internal-components',
            'internal-other',
            ['parent', 'sibling', 'index'],
            ['side_effect_style', 'style'],
        ],
    },
    sortTailwindcss: {
        stylesheet: './src/styles/index.css',
        functions: ['cn', 'cva'],
    },
    overrides: [
        {
            files: ['**/*.css', '**/*.html'],
            options: {
                singleQuote: false,
            },
        },
    ],
});
