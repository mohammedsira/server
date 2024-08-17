import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './mongodb/connect.js';
import Product from './mongodb/models/product.js';

// Routes
import loginRoute from './routes/loginRoute.js';
import signUpRoute from './routes/signUpRoute.js';
import addProduct from './routes/addProduct.js';
import fetchUser from './routes/fetchUser.js';
import fetchAllUserProducts from './routes/fetchAllUserProducts.js';
import fetchAllProducts from './routes/fetchAllProducts.js';
import bidHistoryRoute from './routes/bidHistoryRoute.js';

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origins: ["*"],
    handlePreflightRequest: (req, res) => {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
        "Access-Control-Allow-Headers": "my-custom-header",
        "Access-Control-Allow-Credentials": true,
      });
      res.end();
    }
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('bidproduct', (data) => {
    findProduct(data._id, data.last_bidder, data.biddedPrice);
    socket.broadcast.emit('fetchData', () => console.log('Broadcasting fetchData'));
    console.log(data);
  });
  socket.on('productAdded', () => {
    socket.broadcast.emit('newProductAdded');
  });
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Debugging: Check if the MONGODB_URL is being loaded correctly
console.log('MongoDB URL:', process.env.MONGODB_URL);

// Function to find a product and update its current price
const findProduct = async (_id, last_bidder, new_price) => {
  const filter = { _id: _id };
  const update = {
    last_bidder: last_bidder,
    current_price: new_price
  };
  try {
    const updatedProduct = await Product.findOneAndUpdate(filter, update, {
      new: true
    });
    console.log(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
  }
};

// Middleware
app.use(bodyParser.json());
app.use(express.json({ limit: '50mb' }));

// API Routes
app.use('/api/v1/login', loginRoute);
app.use('/api/v1/signup', signUpRoute);
app.use('/api/v1/getuser', fetchUser);
app.use('/api/v1/addproduct', addProduct);
app.use('/api/v1/fetchAllUserProducts', fetchAllUserProducts);
app.use('/api/v1/fetchAllProducts', fetchAllProducts);
app.use('/api/v1/bidHistory', bidHistoryRoute);

app.get('/', (req, res) => {
  res.status(201).send('Hello from Auction Hub');
});

const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URL); // Ensure DB connection
  } catch (error) {
    console.log('Failed to connect to MongoDB:', error); // Error handling
  }

  server.listen(8080, () => {
    console.log('Server started on port 8080');
  });
};

startServer();
