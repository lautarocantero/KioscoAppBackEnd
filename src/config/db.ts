import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://admin:secret@localhost:27017/mi_base?authSource=admin';
    await mongoose.connect(uri);
    console.log('🍃 MongoDB conectado');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1); // Si no hay DB, no tiene sentido seguir
  }
};