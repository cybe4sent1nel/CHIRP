const express = require('express');
const serverless = require('serverless-http');
const path = require('path');

// Import the main server app
const app = require('../../server.js');

// Wrap Express app for Netlify Functions
module.exports.handler = serverless(app);
