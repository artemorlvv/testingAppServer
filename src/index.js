import "dotenv/config"
import express from "express"
import cors from "cors"
import { sequelize } from "./database/index.js"
import "./database/models.js"
import router from "./routers/index.js"
import errorMiddleware from "./middlewares/errorMiddleware.js"
import cookieParser from "cookie-parser"

const app = express()
const PORT = "5000"

// app.use(cors({ credentials: true, origin: "http://62.217.180.217:3000" }))
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }))
app.use(express.json())
app.use(cookieParser())
app.use("/api", router)
app.use(errorMiddleware)

const start = async () => {
  try {
    await sequelize.authenticate()
    // await sequelize.sync({ force: true })
    await sequelize.sync()
    app.listen(PORT, () => console.log(`app started on port ${PORT}`))
  } catch (e) {
    console.log(e)
  }
}

start()
