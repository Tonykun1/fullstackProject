import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import GlobalContext from '../Context/GlobalContext';
import { useParams } from 'react-router-dom';
import PostCard from './PostCard';
import './MyPost.css';
const MyPost = () => {
  const { nickname } = useParams();
  const { currentUser, setCurrentUser } = useContext(GlobalContext);
  const [posts, setPostsState] = useState([]);
  const [profileImage, setProfileImage] = useState('');
  const [error, setError] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [updatedTitle, setUpdatedTitle] = useState('');
  const [updatedContent, setUpdatedContent] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsResponse = await axios.get(`http://localhost:3000/get-posts/${nickname}`);
        const postsData = postsResponse.data;
  
        const postsWithUserDetails = await Promise.all(postsData.map(async (post) => {
          const userResponse = await axios.get(`http://localhost:3000/get-user/${post.username}`);
          return { ...post, user: userResponse.data };
        }));
        setPostsState(postsWithUserDetails);
  
        const userResponse = await axios.get(`http://localhost:3000/get-user/${nickname}`); 
        setProfileImage(userResponse.data.image);
        setBackgroundImage(userResponse.data.backgroundImage);
  
        if (currentUser && currentUser.friends) {
          setIsFriend(currentUser.friends.includes(nickname));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to fetch data.');
      }
    };
  
    fetchData();
  }, [nickname, currentUser]);
  

  const handleAddFriend = async () => {
    try {
      const response = await axios.post(`http://localhost:3000/add-friend/${currentUser.username}`, {
        friend: nickname
      }, {
        headers: { 'Authorization': `Bearer ${currentUser.token}` },
      });

      if (response.status === 200) {
        setCurrentUser(prev => ({
          ...prev,
          friends: [...(prev.friends || []), nickname]
        }));
        const userResponse = await axios.get(`http://localhost:3000/get-user/${nickname}`);
        setProfileImage(userResponse.data.image);
        setIsFriend(true);
      }
    } catch (error) {

    }
  };

  const handleDeleteFriend = async () => {
    try {
      const response = await axios.delete(`http://localhost:3000/delete-friend/${currentUser.username}?friend=${nickname}`, {
        headers: { 'Authorization': `Bearer ${currentUser.token}` },
      });

      if (response.status === 200) {
        setCurrentUser(prev => ({
          ...prev,
          friends: (prev.friends || []).filter(friend => friend !== nickname)
        }));
        setIsFriend(false);
        const userResponse = await axios.get(`http://localhost:3000/get-user/${nickname}`);
        setProfileImage(userResponse.data.image);
      }
    } catch (error) {
    }
  };

  const handleEditPost = (post) => {
    if (currentUser?.username === post.username) {
      setEditingPost(post);
      setUpdatedTitle(post.title);
      setUpdatedContent(post.content);
      setNewImage(null);
      setError('');
    } else {
      setError('Edit access denied.');
    }
  };

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
        setPostsState(posts.map(post =>
          post.id === editingPost.id
            ? { ...post, title: updatedTitle, content: updatedContent, image: response.data.image }
            : post
        ));
        setEditingPost(null);
        setUpdatedTitle('');
        setUpdatedContent('');
        setNewImage(null);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post. Please try again.');
    }
  };

  const handleDeletePost = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post && currentUser?.username === post.username||currentUser?.role==="admin") {
      try {
        await axios.delete(`http://localhost:3000/delete-post/${postId}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`,
          },
        });

        setPostsState(posts.filter(post => post.id !== postId));
        setEditingPost(null);
      } catch (error) {
        console.error('Error deleting post:', error);
        setError('Failed to delete post. Please try again.');
      }
    } else {
      setError('Permission denied or post not found.');
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
      <div className="background-image" style={{ backgroundImage: `url(http://localhost:3000${backgroundImage})` }}>
        <div className="profile-info" style={{ padding: '20px', color: 'white' }}>
          {profileImage && (
            <img
              src={`http://localhost:3000${profileImage}`}
              alt="User Profile"
              className="profile-img"
              style={{ width: '100px', height: '100px', borderRadius: '50%' }}
            />
          )}
          <h3 className='text-black'>{nickname}</h3>
  
          {currentUser && currentUser.username !== nickname && (
            <div>
              {isFriend ? (
                <button className="btn btn-danger" onClick={handleDeleteFriend}><i className="bi bi-x-circle"></i></button>
              ) : (
                <button className="btn btn-success" onClick={handleAddFriend}><i className="bi bi-plus-circle"></i></button>
              )}
            </div>
          )}
        </div>
      </div>    
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="row">
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                postUser={post.user}
                currentUser={currentUser}
                editingPost={editingPost}
                setEditingPost={setEditingPost}
                updatedTitle={updatedTitle}
                setUpdatedTitle={setUpdatedTitle}
                updatedContent={updatedContent}
                setUpdatedContent={setUpdatedContent}
                prevTitle={post.title}
                prevContent={post.content}
                prevImage={post.image}
                newImage={newImage}
                handleImageChange={handleImageChange}
                handleSaveEdit={handleSaveEdit}
                handleDeletePost={handleDeletePost}
                fetchCommentsReplay={fetchCommentsReplay}
                fetchComments={async (postId) => {
                  try {
                    const response = await axios.get(`http://localhost:3000/posts/${postId}/comments`);
                    return response.data;
                  } catch (error) {
                    console.error('Error fetching comments:', error);
                    return [];
                  }
                }}
              />
            ))
          ) : (
            <div className="alert alert-info">No posts available.</div>
          )}
        </div>
    </div>
  );  
};

export default MyPost;