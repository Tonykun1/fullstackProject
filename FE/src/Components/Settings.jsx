import React, { useContext, useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import GlobelContext from '../Context/GlobalContext.jsx';

const Settings = () => {
    const { setCurrentUser, currentUser, fetchPosts, fetchComments } = useContext(GlobelContext);
    const [username, setUsername] = useState(currentUser?.username || '');
    const [nickname, setNickname] = useState(currentUser?.nickname || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [image, setImage] = useState(currentUser?.image || '');
    const [backgroundImage, setBackgroundImage] = useState(''); 
    const [password, setPassword] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setNickname(currentUser.nickname || '');
            setEmail(currentUser.email || '');
            setImage(currentUser.image || '');
            setBackgroundImage(currentUser.backgroundImage || ''); 
        }
    }, [currentUser]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const imageUrl = URL.createObjectURL(file);
            setImage(imageUrl);
        }
    };

    const handleBackgroundImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setBackgroundImage(imageUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!currentUser) {
            console.error("No current user to update");
            return;
        }
    
        setLoading(true);
    
        const formData = new FormData();
        formData.append('username', username);
        formData.append('nickname', nickname);
        formData.append('email', email);
        formData.append('password', password);
        if (imageFile) {
            formData.append('image', imageFile);
        }
        if (backgroundImage) {
            formData.append('backgroundImage', backgroundImage);
        }
    
        try {
            const response = await fetch(`http://localhost:3000/update-user/${currentUser.username}`, {
                method: 'PUT',
                body: formData
            });
    
            if (!response.ok) {
                throw new Error('Failed to update user');
            }
    
            const updatedUser = await response.json();
            setCurrentUser(updatedUser); 
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log("User updated successfully!");
    
            setBackgroundImage(updatedUser.backgroundImage || '');
    
            fetchPosts();
            fetchComments();
        } catch (error) {
            console.error('Error updating user:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="container mt-5"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '20px'
            }}
        >
            <h2 className="mb-4">Settings</h2>
            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        className="form-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="nickname">Nickname</label>
                    <input
                        type="text"
                        id="nickname"
                        className="form-control"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Enter your nickname"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="backgroundImage">Background Image</label>
                    <input
                        type="file"
                        id="backgroundImage"
                        className="form-control-file"
                        accept="image/*"
                        onChange={handleBackgroundImageChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="image">Image</label>
                    <input
                        type="file"
                        id="image"
                        className="form-control-file"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    
                    {image && (
                        <img
                            src={imageFile ? image : `http://localhost:3000${currentUser.image}`}
                            alt="User"
                            className="img-thumbnail mt-2"
                            style={{ maxWidth: '200px' }}
                        />
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};

export default Settings;
