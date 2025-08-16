import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { FaUpload, FaTrash, FaFileAlt, FaSpinner } from 'react-icons/fa';

const FileManagement = ({ groupId, isUserAdmin }) => {
    const { axiosInstance } = useAuth();
    const socket = useSocket();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const fetchFiles = async () => {
        try {
            const res = await axiosInstance.get(`/api/groups/${groupId}/files`);
            setFiles(res.data);
        } catch (err) {
            console.error('Failed to fetch files:', err);
            setError("Failed to load files.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchFiles();
        }
    }, [groupId]);

    useEffect(() => {
        if (socket) {
            socket.on('file:uploaded', (newFile) => {
                setFiles(prevFiles => [...prevFiles, newFile]);
            });
            socket.on('file:deleted', (fileId) => {
                setFiles(prevFiles => prevFiles.filter(file => file._id !== fileId));
            });
        }
        
        return () => {
            if (socket) {
                socket.off('file:uploaded');
                socket.off('file:deleted');
            }
        };
    }, [socket]);

    const handleFileUpload = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('file-upload');
        const file = fileInput.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('document', file);

        try {
            await axiosInstance.post(`/api/groups/${groupId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            fileInput.value = ''; // Clear the input
        } catch (err) {
            console.error('Failed to upload file:', err);
            setError(err.response?.data?.message || "File upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            await axiosInstance.delete(`/api/groups/${groupId}/files/${fileId}`);
        } catch (err) {
            console.error('Failed to delete file:', err);
            setError(err.response?.data?.message || "File deletion failed.");
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Shared Files</h2>
            {loading ? (
                <p className="text-gray-400">Loading files...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {files.length === 0 ? (
                        <p className="text-gray-400">No files have been shared in this group yet.</p>
                    ) : (
                        files.map(file => (
                            <div key={file._id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                <a
                                    href={`${import.meta.env.VITE_API_BASE_URL}/${file.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-white hover:text-indigo-400 transition-colors"
                                >
                                    <FaFileAlt />
                                    <span>{file.fileName}</span>
                                </a>
                                {isUserAdmin && (
                                    <button
                                        onClick={() => handleDeleteFile(file._id)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
            <form onSubmit={handleFileUpload} className="mt-6 flex space-x-2">
                <input
                    type="file"
                    id="file-upload"
                    name="document"
                    className="flex-1 text-white bg-gray-700 border border-gray-600 rounded-lg p-2"
                    required
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center space-x-2"
                    disabled={uploading}
                >
                    {uploading ? (
                        <FaSpinner className="animate-spin" />
                    ) : (
                        <><FaUpload /> Upload</>
                    )}
                </button>
            </form>
        </div>
    );
};

export default FileManagement;
