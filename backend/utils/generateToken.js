import jwt from "jsonwebtoken"

// The payload now includes the user's name and email
const generateToken = (id, name, email) => {
    return jwt.sign({ id, name, email }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

export default generateToken
