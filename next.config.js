/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable bundle analyzer in development
  experimental: {
    bundlePagesRouterDependencies: true,
    optimizeServerReact: true
  },
  
  // Optimize images
  images: {
    domains: []
  },
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true
          }
        }
      };
    }
    
    return config;
  }
};

module.exports = nextConfig; 