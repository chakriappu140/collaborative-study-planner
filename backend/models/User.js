import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = mongoose.Schema({
    name :{
        type: String,
        required: true
    },
    email: {
        type: String, 
        required: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: { // NEW FIELD
        type: String,
        default: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1600000000/default_avatar.png' // Provide a default avatar URL
    }
},
{timestamps: true})

userSchema.pre('save', async function (next){
    if(!this.isModified('password')){
        next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.matchPassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model('User', userSchema)
export default User
