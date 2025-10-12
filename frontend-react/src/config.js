// Frontend configuration for different environments
const config = {
  development: {
    API_BASE_URL: 'http://localhost:3000'
  },
  production: {
    API_BASE_URL: 'https://data-categorization-backend.whitebush-303875e0.eastus.azurecontainerapps.io'
  }
};

const environment = import.meta.env.MODE || 'production';
export default config[environment];