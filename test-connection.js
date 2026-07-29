// test-connection.js
const mongoose = require('mongoose');

const uri = 'mongodb+srv://lautaroncantero_db_user:00EsfbL1nCW8nvAH@clusterstocko.avp1knh.mongodb.net/tuBaseDeDatos?appName=ClusterStocko';

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Conectado correctamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });