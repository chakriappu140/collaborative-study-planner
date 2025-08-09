import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/db.js"
import userRoutes from "./routes/userRoutes.js"
import groupRoutes from "./routes/groupRoutes.js"
import taskRoutes from "./routes/taskRoutes.js"
import calendarRoutes from "./routes/calendarRoutes.js"
import {notFound, errorHandler} from "./middleware/errorMiddleware.js"

dotenv.config()

connectDB()

const app = express()

app.use(express.json())
app.use(cors())

app.use("/api/users", userRoutes)
app.use("/api/groups", groupRoutes)
app.use("/api/groups/:groupId/tasks", taskRoutes)
app.use("/api/groups/:groupId/calendar", calendarRoutes)

app.get('/', (req, res) => {
    res.send("API is running...")
})

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
})