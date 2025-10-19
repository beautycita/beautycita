const express = require('express');
const app = express();

// Add our stylist routes
const stylistRoutes = require('./src/stylistRoutes');
app.use('/api/stylists', stylistRoutes);

// Start test server
app.listen(5555, () => {
  console.log('Test server running on port 5555');
});