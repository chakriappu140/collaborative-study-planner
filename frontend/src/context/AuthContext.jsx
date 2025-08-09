import React, {createContext, useContext, useState, useEffect} from "react"
import axios from "axios"
import {jwtDecode} from "jwt-decode"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if(token){
            try {
                const decoded = jwtDecode(token)
                if(decoded.exp * 1000 > Date.now()){
                    setUser(decoded)
                }else{
                    localStorage.removeItem('token')
                }
            } catch (error) {
                console.error("Invalid token : ", error)
                localStorage.removeItem('token')
            }
        }
        setLoading(false)
    }, [])

    const login = async (credentials) => {
        try {
            const res = await axios.post('/api/users/login', credentials)
            localStorage.setItem('token', res.data.token)
            setUser(jwtDecode(res.data.token))
        } catch (error) {
            throw new Error(error.response?.data?.message || "Login failed.")
        }
    }

    const signup = async (credentials) => {
        try {
            const res = await axios.post('/api/users', credentials)
            localStorage.setItem('token', res.data.token)
            setUser(jwtDecode(res.data.token))
        } catch (error) {
            throw new Error(error.response?.data?.message || "Sign up failed.")
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    const value = {
        user,
        loading,
        login,
        signup,
        logout
    }

    return (
        <AuthContext.Provider value = {value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}