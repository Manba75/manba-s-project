import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import orderRoutes from "./orderRoutes.js";
import cityRoutes from "./cityRoutes.js";
import vehicleTypeRoutes from "./vehicleTypeRoutes.js";
import customerRoutes from "./customerRoutes.js";
import deliveryPartnerRoutes from './deliveryPartnerRoutes.js'
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/api/customer", customerRoutes);
app.use("/api/dpartner", deliveryPartnerRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/vehicletypes", vehicleTypeRoutes);
app.use("/api/city", cityRoutes);

export default app;