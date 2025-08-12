import React, {useState, useEffect} from "react"
import {useAuth} from "../context/AuthContext.jsx"
import {FaLink, FaCopy} from "react-icons/fa"

const InviteModal = ({groupId, onClose}) => {
    const {axiosInstance} = useAuth()
    const [inviteLink, setInviteLink] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)

    const generateLink = async () => {
        setLoading(true)
        setError("")
        try {
            const res = await axiosInstance.post(`/api/groups/${groupId}/invite`)
            const token = res.data.inviteToken
            const link = `${window.location.origin}/invite/${token}`
            setInviteLink(link)
        } catch (error) {
            setError(error.response?.data?.message || "Failed to generate invite link")
        }finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    useEffect(() => {
        generateLink()
    }, [])

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Group Invite Link</h2>
                {loading && <p className="text-center text-gray-400 ">Generating link...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                {inviteLink && (
                    <div className="space-y-4">
                        <p className="text-gray-400 text-center">Share this link to invite members. It expires in 1 hour.</p>
                        <div className="flex items-center space-x-2 bg-gray-700 p-3 rounded-lg">
                            <FaLink className="text-gray-400 flex-shrink-0"/>
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 bg-transparent border-none outline-none text-white overflow-x-auto"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <FaCopy/>
                            </button>
                        </div>
                        {copied && <p className="text-center text-green-500">Copied to clipboard</p>}
                    </div>
                )}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-300 bg-gray-600 rounded hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InviteModal;