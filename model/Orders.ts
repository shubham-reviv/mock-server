import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
    orderId: { type: String, default: null,unique: true},
    data: {type: Object},
    lastUpdated: {type: Date, default: null},
    createdAt:{type:Date, default:new Date().toISOString() }
});

export default mongoose.model("orders", stockSchema);