import React, {  useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import "./PostCard.css";
import { Button, InputGroup, FormControl, Dropdown } from 'react-bootstrap';
const PostCard = ({
    post,
    postUser,
    currentUser,
    editingPost,
    setEditingPost,
    updatedTitle,
    setUpdatedTitle,
    updatedContent,
    setUpdatedContent,
    prevTitle,
    prevContent,
    prevImage,
    newImage,
    handleImageChange,
    handleSaveEdit,
    handleDeletePost,
    fetchComments,
    fetchCommentsReplay
}) => {
    const [comments, setComments] = useState([]);
    const [commentCount, setCommentCount] = useState(0);

    useEffect(() => {
        const fetchPostComments = async () => {
            try {
                const commentsData = await fetchComments(post.id);
                let totalComments = commentsData.length;
    
                for (const comment of commentsData) {
                    const replies = await fetchCommentsReplay(post.id, comment.id); 
                    totalComments += replies.length;
                }
    
                setComments(commentsData);
                setCommentCount(totalComments);
            } catch (error) {
                console.error('Failed to fetch comments:', error);
            }
        };
    
        fetchPostComments();
    }, [post.id, fetchComments, fetchCommentsReplay]);

    const isEditing = editingPost?.id === post.id;

    const handleSave = () => {
        handleSaveEdit({
            title: updatedTitle.trim() || post.title,
            content: updatedContent.trim() || post.content,
            image: newImage || prevImage,
        });
    };

    const getTextDirection = (text) => {
        const isHebrew = /[\u0590-\u05FF]/.test(text);
        return isHebrew ? 'rtl' : 'ltr';
    };

    const formatDateTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const canModifyPost = () => {
        return currentUser && (
            currentUser.username === post.username ||
            currentUser.role === 'admin'
        );
    };
    
    return (
        <div className="col-md-3 mb-4">
            <div className="card">
                <div className="card-body">
                    {isEditing ? (
                        <>
                            <small className="form-text text-muted">Previous Title: {prevTitle}</small>
                            <small className="form-text text-muted">Previous Content: {prevContent}</small>
                            <div className="mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={updatedTitle || post.title}
                                    onChange={(e) => setUpdatedTitle(e.target.value)}
                                    placeholder="Title"
                                />
                            </div>
                            <div className="mb-3">
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={updatedContent || post.content}
                                    onChange={(e) => setUpdatedContent(e.target.value)}
                                    placeholder="Content"
                                />
                            </div>
                            <div className="mb-3">
                                {prevImage && (
                                    <div>
                                        <img
                                            src={`http://localhost:3000${prevImage}`}
                                            alt="Previous Post"
                                            className="img-fluid mb-2"
                                        />
                                        <small className="form-text text-muted">Previous Image</small>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    className="form-control"
                                    onChange={handleImageChange}
                                />
                            </div>
                            <button className="btn btn-primary me-2" onClick={handleSave}>Save</button>
                            <button className="btn btn-secondary" onClick={() => setEditingPost(null)}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <p>
                                <small>
                                    Time: {formatDateTime(post.timestamp)}
                                </small>
                            </p>
                            <h5 className="card-title" dir={getTextDirection(post.title)}>{post.title}</h5>
                            <Dropdown.Item as={Link} to={`/profile/${postUser?.nickname}`}>
                            <div className='d-flex justify-content-between align-items-center mb-2'>
                                <p className="card-text mb-0"><strong>Posted by: {postUser?.nickname }</strong></p>
                                <img
                                    src={postUser?.image ? `http://localhost:3000${postUser.image}` : 'https://via.placeholder.com/150'}
                                    alt={`${postUser?.nickname}'s photo`}
                                    className="card-img-top rounded-circle img-custom"
                                    style={{ width: '50px', height: '50px' }}
                                />
                            </div>
                            </Dropdown.Item>
                            {post.image && (
                                <img
                                    src={`http://localhost:3000${post.image}`}
                                    className="card-img-bottom img-fluid"
                                    alt="Post"
                                />
                            )}
                            <p className="card-text ql-editor img-fluid" dir={getTextDirection(post.content)} dangerouslySetInnerHTML={{ __html: post.content }}></p>

                            <div className="d-flex justify-content-between mt-2">
                                <Link to={`/posts/${post.id}`} className="btn btn-primary">View</Link>
                                <Link to={`/posts/${post.id}`} className="btn btn-primary">
                                    <p>Comments: {commentCount}</p> 
                                </Link>
                                {canModifyPost() && (
                                    <>
                                        <button className="btn btn-warning me-2" onClick={() => setEditingPost(post)}>Edit</button>
                                        <button className="btn btn-danger" onClick={() => handleDeletePost(post.id)}>Delete</button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCard;
