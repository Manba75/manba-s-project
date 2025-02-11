import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
// import router from './routes'
import db from './config/db.js'
import cookieParser from "cookie-parser";
import {createServer} from 'http';
import { Server } from 'socket.io';
import { initSocket } from './controllers/socketController.js'
import orderRoutes from './routes/orderRoutes.js'
import cityRoutes from './routes/cityRoutes.js'
import vehicleTypeRoutes from './routes/vehicleTypeRoutes.js'
import authRoutes from './routes/authRoutes.js'

dotenv.config()
const port=process.env.PORT || 5000;
const app=express()


const httpServer = createServer(app);

app.use(cors())
app.use(express.json())
app.use(bodyParser.json()) 
app.use(cookieParser())

app.use("/api/authRoutes",authRoutes)
app.use("/api/order", orderRoutes);
app.use('/api/vehicletypes',vehicleTypeRoutes)
app.use('/api/city/',cityRoutes)


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





