import React, { useEffect, useContext, useState } from 'react';
import './Home.css';
import axios from 'axios';
import GlobalContext from '../Context/GlobalContext.jsx';
import PostCard from './PostCard';

const Home = () => {
    const { posts, users, currentUser, setPosts } = useContext(GlobalContext);
    const [editingPost, setEditingPost] = useState(null);
    const [updatedTitle, setUpdatedTitle] = useState('');
    const [updatedContent, setUpdatedContent] = useState('');
    const [prevTitle, setPrevTitle] = useState('');
    const [prevContent, setPrevContent] = useState('');
    const [error, setError] = useState('');
    const [newImage, setNewImage] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('http://localhost:3000/get-posts');
                setPosts(response.data);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setError('Failed to fetch posts.');
            }
        };

        fetchPosts();
    }, [setPosts]);

    const handleImageChange = (e) => {
        setNewImage(e.target.files[0]);
    };

    const handleSaveEdit = async () => {
        if (!updatedTitle.trim() || !updatedContent.trim()) {
            setError('Title and content cannot be empty.');
            return;
        }

        const formData = new FormData();
        formData.append('title', updatedTitle);
        formData.append('content', updatedContent);
        if (newImage) formData.append('image', newImage);

        try {
            const response = await axios.put(`http://localhost:3000/update-post/${editingPost.id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                setPosts(posts.map(post =>
                    post.id === editingPost.id
                        ? { ...post, title: updatedTitle, content: updatedContent, image: response.data.image }
                        : post
                ));
                setEditingPost(null);
                setUpdatedTitle('');
                setUpdatedContent('');
                setPrevTitle('');
                setPrevContent('');
                setNewImage(null);
            }
        } catch (error) {
            console.error('Error updating post:', error);
            setError(error.response?.data?.error || 'Failed to update post. Please try again.');
        }
    };

    const handleDeletePost = async (postId) => {
        const post = posts.find(p => p.id === postId);
        if (post && (currentUser?.username === post.username || currentUser?.role === 'admin')) {
            try {
                await axios.delete(`http://localhost:3000/delete-post/${postId}`, {
                    headers: {
                        'Authorization': `Bearer ${currentUser.token}`,
                    },
                });
    
                setPosts(posts.filter(post => post.id !== postId));
                setEditingPost(null);
            } catch (error) {
                console.error('Error deleting post:', error);
                setError('An error occurred. Please try again.');
            }
        } else {
            setError('Permission denied or post not found.');
        }
    };
    
    

    const fetchComments = async (postId) => {
        try {
            const response = await axios.get(`http://localhost:3000/posts/${postId}/comments`);
            return response.data;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    };
    const fetchCommentsReplay = async (postId, commentId) => {
        try {
            const response = await axios.get(`http://localhost:3000/post/${postId}/comments/${commentId}/Reply`);
            return response.data;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    };
    
    return (
        <div className="container-fluid">
            <div className="mt-4">
                <h2>Posts</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                {posts.length === 0 ? (
                    <p>No posts available</p>
                ) : (
                    <div className="row">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                postUser={users[post.username] || currentUser}
                                currentUser={currentUser}
                                editingPost={editingPost}
                                setEditingPost={setEditingPost}
                                updatedTitle={updatedTitle}
                                setUpdatedTitle={setUpdatedTitle}
                                updatedContent={updatedContent}
                                setUpdatedContent={setUpdatedContent}
                                prevTitle={prevTitle}
                                prevContent={prevContent}
                                prevImage={post.image}
                                newImage={newImage}
                                handleImageChange={handleImageChange}
                                handleSaveEdit={handleSaveEdit}
                                handleDeletePost={handleDeletePost}
                                fetchComments={fetchComments}
                                fetchCommentsReplay={fetchCommentsReplay}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
