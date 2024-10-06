import React, { useState } from 'react';

const ReplyComment = ({ comment }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState(comment.replies || []);

  const handleReply = () => {
    if (replyText.trim()) {
      const newReply = {
        id: Date.now(),
        text: replyText,
        replies: []
      };
      setReplies([...replies, newReply]);
      setReplyText('');
      setShowReplyForm(false);
    }
  };

  return (
    <div style={{ marginLeft: '20px', marginTop: '10px' }}>
      <p>{comment.text}</p>
      <button onClick={() => setShowReplyForm(!showReplyForm)}>
        {showReplyForm ? 'Cancel' : 'Reply'}
      </button>

      {showReplyForm && (
        <div>
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
          />
          <button onClick={handleReply}>Submit Reply</button>
        </div>
      )}

      {replies.length > 0 && (
        <div>
          {replies.map((reply) => (
            <ReplyComment key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReplyComment