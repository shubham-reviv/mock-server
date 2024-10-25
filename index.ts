import http from "http";
import app from "./app";
const server = http.createServer(app);

const PORT = process.env.API_PORT || 8080;

server.listen(PORT, () => console.log(`The server is running on port ${PORT}`));