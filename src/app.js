const allowedOrigins = [
  "https://app.faxnova.com",
  "https://admin.faxnova.com",
  "http://localhost:3000"
];

const corsOptions = {
  origin(origin, callback) {
    // Allow workers, CLI tools, health checks, webhooks
    if (!origin) return callback(null, true);

    // Allow exact matches
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow *.faxnova.com (Render previews, staging, future subdomains)
    if (origin.endsWith(".faxnova.com")) return callback(null, true);

    return callback(new Error("CORS: Origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
