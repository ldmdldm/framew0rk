/**
 * API catch-all route handler for /api/* paths
 * 
 * This handler will return information about the requested path
 * The simpler implementation is preserved as a fallback function.
 */

// Simple handler defined as a regular function (not exported)
function simpleHandler(req, res) {
  // Get path from query parameters
  const pathSegments = req.query.path || [];
  const fullPath = '/api/' + pathSegments.join('/');
  
  // Return a simple JSON response
  res.status(200).json({
    success: true,
    message: 'API route is working correctly',
    requestInfo: {
      method: req.method,
      path: fullPath,
      timestamp: new Date().toISOString(),
      query: req.query
    }
  });
}

/**
 * API Catch-All Handler
 * 
 * This file handles all API requests by forwarding them to our Express application.
 * It includes detailed logging and error handling to simplify debugging.
 */

// Import required modules
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { parse } from 'url';

// Generate a unique request ID
const generateRequestId = () => {
  return uuidv4();
};

// Define request logger
const logRequest = (req, requestId) => {
  console.log(`[${requestId}] ${new Date().toISOString()} - REQUEST: ${req.method} ${req.url}`);
  console.log(`[${requestId}] Headers: ${JSON.stringify(req.headers)}`);
  console.log(`[${requestId}] Query: ${JSON.stringify(req.query)}`);
  if (req.body) {
    console.log(`[${requestId}] Body: ${JSON.stringify(req.body, null, 2).substring(0, 1000)}${JSON.stringify(req.body).length > 1000 ? '...(truncated)' : ''}`);
  }
};

// Define response logger
const logResponse = (status, body, requestId, startTime) => {
  const duration = Date.now() - startTime;
  console.log(`[${requestId}] ${new Date().toISOString()} - RESPONSE: Status ${status} (${duration}ms)`);
  if (body) {
    console.log(`[${requestId}] Body: ${JSON.stringify(body, null, 2).substring(0, 1000)}${JSON.stringify(body).length > 1000 ? '...(truncated)' : ''}`);
  }
};
// Global variables for app caching
let appPromise;
let appImportError = null;
let appInitialized = false;

// Constants for debugging
const DEBUG = true; // Set to false in production if the logs are too verbose
const TIMEOUT_MS = 30000; // 30 seconds timeout for requests
// Enhanced logger with request ID
const logWithRequestId = (requestId, level, message, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${requestId}] ${timestamp} - ${level}: ${message}`);
  if (data !== undefined) {
    console.log(`[${requestId}] ${JSON.stringify(data, null, 2).substring(0, 1000)}${JSON.stringify(data).length > 1000 ? '...(truncated)' : ''}`);
  }
};

// Handler for Vercel serverless function
// The main handler function that will be exported
export default async function handler(req, res) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Setup response intercept to track responses
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    logWithRequestId(requestId, 'INFO', `Response completed in ${duration}ms with status ${res.statusCode}`);
    if (chunk && DEBUG) {
      try {
        const body = chunk.toString(encoding || 'utf8');
        if (body.length < 1500) { // Don't log large responses
          logWithRequestId(requestId, 'DEBUG', 'Response body', body);
        } else {
          logWithRequestId(requestId, 'DEBUG', `Response body too large (${body.length} bytes)`);
        }
      } catch (e) {
        logWithRequestId(requestId, 'DEBUG', 'Unable to log response body', e.message);
      }
    }
    return originalEnd.apply(this, arguments);
  };
  
  // Add timeout handling
  const timeoutId = setTimeout(() => {
    if (!res.writableEnded) {
      logWithRequestId(requestId, 'ERROR', `Request timed out after ${TIMEOUT_MS}ms`);
      res.statusCode = 504;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Gateway Timeout',
        message: 'Request processing took too long and timed out',
        request_id: requestId,
        timestamp: new Date().toISOString()
      }));
    }
  }, TIMEOUT_MS);
  
  // Clear timeout when response ends
  res.on('finish', () => {
    clearTimeout(timeoutId);
  });
  
  logWithRequestId(requestId, 'INFO', `Incoming request: ${req.method} ${req.url}`);
  logWithRequestId(requestId, 'DEBUG', 'Request headers', req.headers);
  
  
  // Read request body if available
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      const bodyPromise = new Promise((resolve, reject) => {
        const bodyChunks = [];
        req.on('data', (chunk) => bodyChunks.push(chunk));
        req.on('end', () => {
          try {
            const rawBody = Buffer.concat(bodyChunks).toString();
            if (rawBody) {
              logWithRequestId(requestId, 'DEBUG', 'Request body length', rawBody.length);
              if (rawBody.length < 1500 && DEBUG) { // Don't log large payloads
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                  try {
                    const jsonBody = JSON.parse(rawBody);
                    logWithRequestId(requestId, 'DEBUG', 'Request JSON body', jsonBody);
                  } catch (e) {
                    logWithRequestId(requestId, 'DEBUG', 'Request body (invalid JSON)', rawBody);
                  }
                } else {
                  logWithRequestId(requestId, 'DEBUG', 'Request body', rawBody);
                }
              }
            }
            resolve();
          } catch (e) {
            logWithRequestId(requestId, 'ERROR', 'Error parsing request body', e);
            resolve(); // Continue even if we can't parse the body
          }
        });
        req.on('error', (e) => {
          logWithRequestId(requestId, 'ERROR', 'Error reading request body', e);
          reject(e);
        });
      });
      
      // Wait for body to be read, but set a timeout
      await Promise.race([
        bodyPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Body parsing timed out')), 5000))
      ]).catch(e => {
        logWithRequestId(requestId, 'ERROR', 'Body processing error (continuing anyway)', e.message);
      });
    } catch (e) {
      logWithRequestId(requestId, 'ERROR', 'Error processing request body (continuing anyway)', e.message);
    }
  }

  try {
    // Set processing milestones for debugging
    const processingSteps = {
      started: Date.now(),
      appImport: null,
      appHandlerCalled: null,
      completed: null
    };
    
    // If we previously had an error importing the app, don't keep trying
    if (appImportError) {
      logWithRequestId(requestId, 'ERROR', 'Using cached error - App import previously failed', appImportError);
      throw appImportError;
    }
    
    // Parse the URL
    const parsedUrl = parse(req.url, true);
    logWithRequestId(requestId, 'DEBUG', 'Parsed URL', parsedUrl);
    
    // Remove the /api prefix from the path before forwarding
    const path = parsedUrl.pathname.replace(/^\\/api/, '') || '/';
    logWithRequestId(requestId, 'INFO', `Original path: ${parsedUrl.pathname}, Transformed path: ${path}`);
    
    // Update the URL in the request
    req.url = path + (parsedUrl.search || '');
    logWithRequestId(requestId, 'INFO', `Forwarding to internal path: ${req.url}`);
    
    // Add convenience debugging info
    req._requestId = requestId; // Allow sub-components to access the request ID
    
    // Lazily import the Express app to improve cold start times
    if (!appPromise) {
      logWithRequestId(requestId, 'INFO', 'First request - importing Express app...');
      
      appPromise = new Promise((resolve, reject) => {
        // Add a timeout for the import to prevent hanging
        const importTimeoutId = setTimeout(() => {
          appImportError = new Error('Timeout importing Express app after 10 seconds');
          reject(appImportError);
        }, 10000);
        
        import('../dist/server/index.js')
          .then(module => {
            clearTimeout(importTimeoutId);
            
            processingSteps.appImport = Date.now();
            logWithRequestId(requestId, 'DEBUG', `App import completed in ${processingSteps.appImport - processingSteps.started}ms`);
            
            const app = module.default;
            if (!app) {
              const error = new Error('Express app not exported from dist/server/index.js');
              appImportError = error;
              reject(error);
              return;
            }
            
            if (typeof app.handle !== 'function') {
              const error = new Error(`Express app exported but does not have handle method. Export type: ${typeof app}, Properties: ${Object.keys(app).join(', ')}`);
            appImportError = error;
            reject(error);
            return;
          }
          
          logWithRequestId(requestId, 'INFO', 'Express app successfully imported');
          appInitialized = true;
          resolve(app);
        }).catch(error => {
          clearTimeout(importTimeoutId);
          logWithRequestId(requestId, 'ERROR', 'Failed to import Express app', error);
          logWithRequestId(requestId, 'DEBUG', 'Module import error details', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            path: error.path || 'N/A'
          });
          appImportError = error;
          reject(error);
        });
      });
    }
    
    // Get the Express app
    logWithRequestId(requestId, 'DEBUG', 'Waiting for Express app...');
    const app = await Promise.race([
      appPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout waiting for app initialization')), 15000)
      )
    ]);
    
    // Check if the environment is properly set up
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      logWithRequestId(requestId, 'ERROR', `Missing required environment variables: ${missingEnvVars.join(', ')}`);
      // Continue anyway, but log the warning - the app might handle this internally
    }
    
    logWithRequestId(requestId, 'INFO', `Delegating to Express app handler (initialized: ${appInitialized})`);
    processingSteps.appHandlerCalled = Date.now();
    
    // Create a promise that resolves when the request is handled
    const handlerPromise = new Promise((resolve, reject) => {
      try {
        // Delegate the request to the Express app
        app.handle(req, res, (err) => {
          if (err) {
            logWithRequestId(requestId, 'ERROR', 'Express handler error', err);
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (err) {
        logWithRequestId(requestId, 'ERROR', 'Express handler exception', err);
        reject(err);
      }
    });
    
    // Wait for the handler to complete with a timeout
    await Promise.race([
      handlerPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request handler timed out')), 25000)
      )
    ]);
    
    processingSteps.completed = Date.now();
    logWithRequestId(
      requestId, 
      'INFO', 
      `Request processing completed in ${processingSteps.completed - processingSteps.started}ms`,
      {
        timing: {
          total: processingSteps.completed - processingSteps.started,
          appImport: processingSteps.appImport ? processingSteps.appImport - processingSteps.started : null,
          handlerCall: processingSteps.appHandlerCalled ? processingSteps.appHandlerCalled - processingSteps.started : null,
          handlerExecution: processingSteps.completed - processingSteps.appHandlerCalled
        }
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error in API route:`, error);
    
    // Provide more specific error messages based on the type of error
    let statusCode = 500;
    let errorMessage = 'Internal Server Error';
    
    if (error.message && error.message.includes('not properly exported')) {
      statusCode = 502;
      errorMessage = 'API Configuration Error: Server app not properly exported';
    } else if (error.code === 'MODULE_NOT_FOUND') {
      statusCode = 502;
      errorMessage = 'API Configuration Error: Server module not found';
    }
    
    // If there's an error loading the Express app, fall back to the simple handler
    if (error.code === 'MODULE_NOT_FOUND' || error.message.includes('import')) {
      logWithRequestId(requestId, 'INFO', 'Falling back to simple handler due to server import error');
      try {
        // Call the simple handler as a fallback
        simpleHandler(req, res);
        return;
      } catch (fallbackError) {
        logWithRequestId(requestId, 'ERROR', 'Fallback handler also failed', fallbackError);
        // Continue to the error response below
      }
    }
    
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: errorMessage,
      request_id: requestId,
      timestamp: new Date().toISOString()
    }));
  }
}

