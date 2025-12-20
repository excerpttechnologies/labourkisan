const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const history = require('connect-history-api-fallback');
const errorHandler = require("./middleware/errorHandler");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
connectDB();
app.use('/uploads', express.static('uploads'));

// Commented out routes - uncomment when route files are available
// app.use("/category", require("./routes/categoryRoutes"));
// app.use("/subcategory", require("./routes/subcategory"));
// app.use("/farmer/register", require("./routes/farmerRoutes"));
// app.use("/farmer", require("./routes/authroutes"));
// app.use('/product', require('./routes/product'));

app.use("/employee", require("./routes/employeeRoutes"));
app.use("/labour", require("./routes/labourRoutes"));

// Error handler middleware (must be after all routes)
app.use(errorHandler);

app.use(history());
app.use(express.static(path.join(__dirname, 'dist')));

app.listen(8080, () => console.log("Server running on port 8080"));
