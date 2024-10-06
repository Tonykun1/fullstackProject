import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './Components/Header';
import Home from './Components/Home';
import AddPost from './Components/AddPost';
import About from './Components/About';
import Login from './Components/Login';
import Settings from './Components/Settings';
import SignUp from './Components/SignUp';
import PostById from './Components/PostById';
import GlobelContext from './Context/GlobalContext.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import MyPost from './Components/MyPost.jsx';
import Chat from './Components/Chat.jsx';
import io from 'socket.io-client';

const App = () => {
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState({});
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

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:3000/get-users');
            const userMap = response.data.reduce((acc, user) => {
                acc[user.username] = user;
                return acc;
            }, {});
            setUsers(userMap);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchUsers();
    }, []);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    const addPost = (newPost) => {
        setPosts((prevPosts) => [...prevPosts, newPost]);
    };
    if (process.env.NODE_ENV === 'development') {
        const originalError = console.error;
        console.error = (...args) => {
            if (/findDOMNode is deprecated/.test(args[0])) {
                return;
            }
            originalError.call(console, ...args);
        };
    }
    const socket = io('http://localhost:3000');
    return (
        <GlobelContext.Provider value={{ currentUser, setCurrentUser, posts, setPosts, users, addPost }}>
            <Router>
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/add-post" element={<AddPost />} />
                    <Route path="/posts/:id" element={<PostById />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/sign-up" element={<SignUp />} />
                    <Route path="/profile/:nickname" element={<MyPost />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/chat/:nickname" element={<Chat socket={socket}/>} />
                </Routes>
            </Router>
        </GlobelContext.Provider>
    );
};

export default App;

