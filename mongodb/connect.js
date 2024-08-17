import mongoose from 'mongoose';

const connectDB = async (uri) => {
    mongoose.set('strictQuery', true);
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

export default connectDB;
