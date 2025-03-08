const { validatedRequest } = require('./validatedRequest');
const { validApiKey } = require('./validApiKey');
const { validWorkspace } = require('./validWorkspace');
const { validBrowserExtensionApiKey } = require('./validBrowserExtensionApiKey');
const { chatHistoryViewable } = require('./chatHistoryViewable');
const { multiUserProtected } = require('./multiUserProtected');
const { featureFlagEnabled } = require('./featureFlagEnabled');
const { embedMiddleware } = require('./embedMiddleware');
const { isSupportedRepoProviders } = require('./isSupportedRepoProviders');
const { simpleSSOEnabled } = require('./simpleSSOEnabled');
const { communityHubDownloadsEnabled } = require('./communityHubDownloadsEnabled');

// User role validation middlewares
const flexUserRoleValid = (req, res, next) => {
  if (!res.locals.user) {
    return next();
  }
  
  const { role } = res.locals.user;
  if (role !== 'admin' && role !== 'manager') {
    return res.status(403).json({ error: 'User does not have sufficient permissions.' });
  }
  
  next();
};

module.exports = {
  validatedRequest,
  validApiKey,
  validWorkspace,
  validBrowserExtensionApiKey,
  chatHistoryViewable,
  multiUserProtected,
  featureFlagEnabled,
  embedMiddleware,
  isSupportedRepoProviders,
  simpleSSOEnabled,
  communityHubDownloadsEnabled,
  flexUserRoleValid,
};