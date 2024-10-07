import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import GlobalContext from '../Context/GlobalContext';
import EditPost from './EditPost';
import CommentItem from './CommentItem';

const PostById = () => {
    const { currentUser, setCommentCount } = useContext(GlobalContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [error, setError] = useState('');
    const [postUser, setPostUser] = useState(null);
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [isEditingComment, setIsEditingComment] = useState(null);

    useEffect(() => {
      const fetchPost = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/posts/${id}`);
            if (response.data) {
                const fetchedComments = response.data.comments.map(comment => ({
                    ...comment,
                    replies: comment.replies || [], // Ensure replies is initialized
                }));
                setPost(response.data);
                setComments(fetchedComments);
                if (setCommentCount) {
                    setCommentCount(fetchedComments.length);
                }
                if (response.data.username) {
                    const userResponse = await axios.get(`http://localhost:3000/get-user/${response.data.username}`);
                    setPostUser(userResponse.data);
                }
            } else {
                setError('Post not found.');
            }
        } catch (err) {
            setError('Failed to fetch the post.');
        }
    };

        fetchPost();
    }, [id, setCommentCount]);

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            setError('Comment cannot be empty.');
            return;
        }

        if (!currentUser) {
            setError('You need to be logged in to comment.');
            return;
        }

        try {
            const response = await axios.post(`http://localhost:3000/posts/${id}/comments`, {
                content: newComment,
                username: currentUser.username
            });

            const userResponse = await axios.get(`http://localhost:3000/get-user/${currentUser.username}`);
            const newCommentWithUser = {
                ...response.data,
                nickname: userResponse.data.nickname,
                image: userResponse.data.image,
                timestamp: response.data.timestamp,
                replies: [],
            };

            setComments([...comments, newCommentWithUser]);
            setNewComment('');
            setError('');
        } catch (err) {
            console.error('Failed to add comment:', err);
            setError('Failed to add comment.');
        }
    };

    const CommentModules = {
        toolbar: [
            [{ 'header': '1'}, { 'header': '2'}, { 'font': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['bold', 'italic', 'underline'],
            [{ 'align': [] }],
            ['link', 'image']
        ],
    };

    const CommentFormats = [
        'header', 'font', 'list', 'bold', 'italic', 'underline', 'align', 'link', 'image'
    ];

    const handleReply = async (parentCommentId, replyContent) => {
      try {
          const response = await axios.post(`http://localhost:3000/posts/${id}/comments/${parentCommentId}/replies`, {
              content: replyContent,
              username: currentUser.username
          });
  
          const userResponse = await axios.get(`http://localhost:3000/get-user/${currentUser.username}`);
          const newReplyWithUser = {
              ...response.data,
              nickname: userResponse.data.nickname,
              image: userResponse.data.image,
              timestamp: response.data.timestamp,
          };
  
          // Update the comments state to include the new reply
          setComments(comments.map(comment =>
              comment.id === parentCommentId
                  ? { ...comment, replies: [...(comment.replies || []), newReplyWithUser] }
                  : comment
          ));
          setError('');
      } catch (err) {
          console.error('Failed to reply to comment:', err);
          setError('Failed to reply to comment.');
      }
  };
  

    const handleEditComment = async (commentId, content) => {
        try {
            await axios.put(`http://localhost:3000/posts/${id}/comments/${commentId}`, {
                content
            });

            setComments(comments.map(comment =>
                comment.id === commentId ? { 
                    ...comment, 
                    content, 
                    editTimestamp: new Date().toISOString() 
                } : comment
            ));
            setIsEditingComment(null);
        } catch (err) {
            console.error('Failed to edit comment:', err);
            setError('Failed to edit comment.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await axios.delete(`http://localhost:3000/posts/${id}/comments/${commentId}`);
            setComments(comments.filter(comment => comment.id !== commentId));
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    };
    
    const handleDeletePost = async () => {
        if (post && (currentUser?.username === post.username || currentUser?.role === 'admin')) {
            try {
                await axios.delete(`http://localhost:3000/delete-post/${post.id}`, {
                    headers: {
                        'Authorization': `Bearer ${currentUser.token}`,
                    },
                });
    
                navigate('/');
            } catch (error) {
                console.error('Error deleting post:', error);
                setError('Failed to delete post. Please try again.');
            }
        } else {
            setError('Permission denied or post not found.');
        }
    };
    
    return (
      <div className="container mt-4">
        {error && <div className="alert alert-danger">{error}</div>}
        {isEditingPost ? (
          <EditPost
            post={post}
            onSave={(updatedPost) => {
              setPost(updatedPost);
              setIsEditingPost(false);
            }}
            onCancel={() => setIsEditingPost(false)}
            token={currentUser?.token}
          />
        ) : post ? (
          <div>
            <h1>{post.title}</h1>

            <div className="mt-2">
              {postUser?.image && (
                <img
                  src={`http://localhost:3000${postUser.image}`}
                  alt="User"
                  className="img-thumbnail"
                  style={{ width: "50px", height: "50px" }}
                />
              )}

              {postUser?.nickname && (
                <span className="px-2">Post by: {postUser.nickname}</span>
              )}
            </div>
            <p>Time: {formatDateTime(post.timestamp)}</p>
            {post.editTimestamp && post.editTimestamp !== post.timestamp && (
              <p>Last Edit Time: {formatDateTime(post.editTimestamp)}</p>
            )}
            {post.image && (
              <img
                src={`http://localhost:3000${post.image}`}
                alt="Post"
                className="img-fluid my-3"
              />
            )}
            <p dangerouslySetInnerHTML={{ __html: post.content }}></p>
            {(currentUser?.username === post.username ||
              currentUser?.role === "admin") && (
              <div>
                <button
                  onClick={() => setIsEditingPost(true)}
                  className="btn btn-primary mx-1"
                >
                  Edit
                </button>
                <button onClick={handleDeletePost} className="btn btn-danger">
                  Delete
                </button>
              </div>
            )}
          </div>
        ) : (
          <p>Loading post...</p>
        )}

        <div className="mt-5">
          <h2>Comments</h2>
          {comments.length > 0 ? (
            <div className="comment-list">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={id}
                  onReply={handleReply} 
                  onDelete={handleDeleteComment}
                  onEdit={handleEditComment}
                  isEditing={isEditingComment === comment.id}
                  setIsEditing={setIsEditingComment}
                  currentUser={currentUser}
                  formatDateTime={formatDateTime}
                />
              ))}
            </div>
          ) : (
            <p>No comments yet.</p>
          )}
        </div>

        {currentUser ? (
          <div className="mt-4">
            <h2>Add a Comment</h2>
            <ReactQuill
              value={newComment}
              onChange={setNewComment}
              modules={CommentModules}
              formats={CommentFormats}
              placeholder="Write a comment..."
            />
            <button onClick={handleAddComment} className="btn btn-primary mt-2">
              Add Comment
            </button>
            {error && <div className="alert alert-danger mt-2">{error}</div>}
          </div>
        ) : (
          <p>Please log in to add a comment.</p>
        )}
      </div>
    );
}    

export default PostById;
