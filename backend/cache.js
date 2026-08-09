'use strict';

// One cache shared by all API routers. Mutations such as an autonomous
// correction can therefore invalidate every affected dashboard view.
const NodeCache = require('node-cache');

module.exports = new NodeCache({ stdTTL: 30, checkperiod: 60 });
