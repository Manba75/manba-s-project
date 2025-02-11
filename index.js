import app from './routes/index.js'
import dotenv from 'dotenv'
import db from './config/db.js'
import {createServer} from 'http';
import { Server } from 'socket.io';
import { initSocket } from './controllers/socketController.js'
dotenv.config()
const port=process.env.PORT || 5000;

const httpServer = createServer(app);


initSocket(httpServer);
httpServer.listen(port,()=>{
    try {
        console.log(`Server is running on port ${port}`);
        db.connect()
          .then(() => {
            
            console.log("DB is connected");
          })
          .catch((error) => {
            console.log("connection error in DB", error);
          });
     
       
        
    } catch (error) {
        console.log("error",error)
    }
})





