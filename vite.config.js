export default {
  build: {
    chunkSizeWarningLimit: 900
  },
  server: {
    proxy: {
      "/api": "http://localhost:4173"
    }
  }
};
