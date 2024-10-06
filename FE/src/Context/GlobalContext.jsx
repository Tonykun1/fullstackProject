import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [commentCount, setCommentCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const fetchPosts = async () => {
        try {
            const response = await axios.get('http://localhost:3000/get-posts');
            setPosts(response.data);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await axios.get('http://localhost:3000/get-comments');
            
            setCommentCount(response.data.length);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchComments();
    }, []);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    return (
        <GlobalContext.Provider value={{
            posts,
            setPosts,
            commentCount,
            setCommentCount,
            currentUser,
            setCurrentUser,
            fetchPosts,
            fetchComments
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalContext;
