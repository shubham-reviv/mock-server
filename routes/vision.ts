const express = require("express");
const router = express.Router();
const axios = require("axios");
import Orders from"../model/Orders";
import { Request,Response} from "express";
const dateFns = require("date-fns");
const VISION_LOGISTICS_API_URL = process.env.VISION_LOGISTICS_API_URL || "http://portal.visionlogistics.uk:82/api/v1";

router.get("/auth",async (req: Request, res: Response) => {
    try {
        const response = await forwardHttpRequest(req, req.originalUrl)
        return res.status(response.status).send(response.data);
    } catch(err){
        return res.status(500).send(err.toString());
    }
});

router.post("/order/new",async (req: Request, res: Response) => {
    try {
        const response = await forwardHttpRequest(req, req.originalUrl);
        if(!response.data.reference){
            return res.status(response.status).send(response.data);
        }
        const visionOrder = await getVisionOrder(req, response.data.reference);
        const order = new Orders({orderId: response.data.reference, data: visionOrder.data[0]});
        await order.save();
        return res.status(response.status).send(response.data);
    } catch(err){
        return res.status(500).send(err.toString());
    }
});

const forwardHttpRequest = (req: Request, url: string) =>{
    const targetUrl = VISION_LOGISTICS_API_URL+url;
    // Forward the request using axios
    return axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
    });
}

const getVisionOrder = (req: Request, orderId: string)=>{
    const targetUrl = `${VISION_LOGISTICS_API_URL}/orders?token=${req.query.token}&orderID=${orderId}`;
    console.log(targetUrl, "targetUrl")
    return axios({
        url: targetUrl,
    });
}

router.put("/order/:orderID",async (req: Request, res: Response) => {
    try {
        const order = await Orders.findOne({orderId: req.params.orderID});
        if(!["SENT", "RETURN","ONWARD"].includes(req.body.status)){
            return res.status(400).send("Invalid status");
        }
        if(!order){
            return res.status(404).send("Order not found");
        }
        const event = {
            "code": "SENT",
            "description": "Order Despatched.",
            "datetime": dateFns.format(new Date(),"yyyy-MM-dd HH:mm:ss"),
            "reference": "DN328421-24"
        };
        order.data.events = (order.data.events || []);
        order.data.metadata = (order.data.metadata || []);
        switch(req.body.status){
            case "RETURN":
                event.code = "RETURN";
                break;
            case "ONWARD":
                event.code = "ONWARD";
                break;
            default:
                break;
        }
        if(req.body.vialCode){
            order.data.metadata.push({
                "key": "VIAL",
                "value": req.body.vialCode
            });
        }
        order.data.events.push(event);
        order.data.lastUpdated = dateFns.format(new Date(),"yyyy-MM-dd HH:mm:ss");
        await Orders.updateOne({orderId: req.params.orderID},{
            data: order.data,
            lastUpdated: new Date().toISOString()
        }).exec();
        return res.send("Updated successfully.");
    } catch(err){
        return res.status(500).send(err.toString());
    }
});

router.get("/orders",async (req: Request, res: Response) => {
    try {
        if(!req.query.lastUpdated){
            return res.status(400).send("lastUpdated is required");
        }
        const orders = await Orders.find({lastUpdated: {$gt: new Date(req.query.lastUpdated).toISOString()}});
        return res.send(orders.map((order)=>order.data));
    } catch(err){
        return res.status(500).send(err.toString());
    }
});

module.exports = router;