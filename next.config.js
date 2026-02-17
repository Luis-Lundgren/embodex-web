/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '**',
            },
        ],
    },
    transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://ssl.gstatic.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; object-src 'none'; frame-src https://accounts.google.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/;",
                    },
                ],
            },
        ];
    },
    webpack: (config, { dev }) => {
        if (dev) {
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
                ignored: ['**/node_modules', '**/.next', '**/datasets'],
            }
        }
        return config
    },
};

module.exports = nextConfig;
