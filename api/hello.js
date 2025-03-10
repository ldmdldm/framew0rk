// Simple API endpoint for Vercel deployment
export default function handler(req, res) {
  // Allow both GET and POST methods for easy testing
  res.status(200).json({
    message: "Hello from API!",
    success: true,
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query
  });
}

