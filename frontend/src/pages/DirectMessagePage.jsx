import React from "react";
import DirectMessagesModal from "../components/DirectMessagesModal.jsx";
import { useParams, useNavigate } from "react-router-dom";

const DirectMessagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Pass id as the initial recipientId to the modal
  return (
    <DirectMessagesModal
      initialRecipientId={id}
      onClose={() => navigate("/dashboard")}
    />
  );
};

export default DirectMessagePage;
