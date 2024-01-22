/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
    cacheDirectory: './node_modules/.cache/remix',
    ignoredRouteFiles: ['**/.*', '**/*.test.{js,jsx,ts,tsx}'],
    serverDependenciesToBundle: ['@wesp-up/ui'],
    watchPaths: ['node_modules/@wesp-up/ui/**/*', 'server/**/*'],
    serverModuleFormat: 'cjs',
};
