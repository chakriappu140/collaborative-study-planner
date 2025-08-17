import React from 'react';
import { FaUserCircle } from 'react-icons/fa';

const MembersList = ({ members }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Group Members ({members.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {members.length === 0 ? (
                    <p className="text-gray-400">No members found.</p>
                ) : (
                    members.map(member => (
                        <div key={member._id} className="bg-gray-700 p-4 rounded-lg flex items-center space-x-4">
                            {member.avatar ? (
                                <img src={member.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <FaUserCircle size={40} className="text-gray-400" />
                            )}
                            <div>
                                <p className="text-white font-semibold">{member.name}</p>
                                <p className="text-gray-400 text-sm">{member.email}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MembersList;
