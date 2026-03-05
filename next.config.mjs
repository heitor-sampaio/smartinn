/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Ignora erros de ESLint no build de produção (estilo, any, unused-vars, etc.)
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Ignora erros de TypeScript no build de produção
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
