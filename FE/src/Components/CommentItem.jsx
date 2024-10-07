import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios'; 

const CommentItem = ({ comment, postId, onDelete, onEdit, onReply, formatDateTime, currentUser, depth = 0 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [replyContent, setReplyContent] = useState('');
    const [showReply, setShowReply] = useState(false);

    const handleEditSave = () => {
        onEdit(comment.id, editContent);
        setIsEditing(false);
    };

    const handleReply = () => {
        if (replyContent.trim()) {
            onReply(comment.id, replyContent);
            setReplyContent('');
            setShowReply(false);
        }
    };

    const handleEdit = async (commentId, newContent, replyId = null) => {
        try {
            const endpoint = replyId 
                ? `/posts/${postId}/comments/${commentId}/replies/${replyId}`
                : `/posts/${postId}/comments/${commentId}`;
            
            console.log('PUT Request URL:', endpoint); // Debug line
            
            await axios.put(endpoint, {
                content: newContent,
                username: currentUser.username
            });
    
            if (replyId) {
                onEdit(commentId, newContent, replyId); 
            } else {
                onEdit(commentId, newContent); 
            }
        } catch (error) {
            console.error('Failed to update comment/reply:', error);
        }
    };
    

    const handleDelete = async (commentId, replyId = null) => {
        try {
            const endpoint = replyId 
                ? `/posts/${postId}/comments/${commentId}/replies/${replyId}`
                : `/posts/${postId}/comments/${commentId}`;
    
            await axios.delete(endpoint);
            onDelete(commentId); 
        } catch (error) {
            console.error('Failed to delete comment/reply:', error);
        }
    };

    return (
        <div className="comment-item mb-4 border border-light p-3 rounded shadow-sm bg-white" style={{ marginLeft: `${depth * 20}px` }}>
            <div className='d-flex justify-content-between'>
                <div className="d-flex align-items-center mb-2">
                    {comment.image && (
                        <img
                            src={`http://localhost:3000${comment.image}`}
                            alt="User"
                            className="img-thumbnail rounded-circle"
                            style={{ width: "50px", height: "50px" }}
                        />
                    )}
                    <div className="ml-2">
                        <span className="font-weight-bold">
                            {comment.nickname || comment.username}
                        </span>
                        <div className="text-muted small">
                            {formatDateTime(comment.timestamp)}
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <div>
                        <div className="d-flex">
                            {(comment.username === currentUser?.username || currentUser?.role === 'admin') && (
                                <div>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn btn-outline-primary mt-2"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="btn btn-outline-danger mt-2"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => setShowReply(!showReply)}
                                className={`btn ${showReply ? "btn btn-outline-danger" : "btn btn-outline-success"} mt-2`}
                            >
                                {showReply ? "Cancel Reply" : "Reply"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {isEditing && (
                <div>
                    <ReactQuill
                        value={editContent}
                        onChange={setEditContent}
                        className="mb-2"
                    />
                    <div className="d-flex">
                        <button
                            onClick={handleEditSave}
                            className="btn btn-outline-primary mr-2"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="btn btn-outline-danger"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {!isEditing && (
                <p className="mb-2" dangerouslySetInnerHTML={{ __html: comment.content }}></p>
            )}
            {showReply && (
                <div className="mt-3">
                    <ReactQuill
                        value={replyContent}
                        onChange={setReplyContent}
                        placeholder="Write a reply..."
                        className="mb-2"
                    />
                    <button onClick={handleReply} className="btn btn-outline-primary">
                        Send Reply
                    </button>
                </div>
            )}
            {(comment.replies || []).map((reply) => (
                <CommentItem
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    onDelete={handleDelete} 
                    onEdit={handleEdit} 
                    onReply={onReply}
                    formatDateTime={formatDateTime}
                    currentUser={currentUser}
                    depth={depth + 1}  
                />
            ))}
        </div>
    );
};

export default CommentItem;
