import React, { useContext, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import GlobelContext from '../Context/GlobalContext.jsx';

const Login = () => {
    const { setCurrentUser } = useContext(GlobelContext);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data: users } = await axios.get('http://localhost:3000/get-users');
            const user = users.find(user =>
                (user.username.toLowerCase() === identifier.toLowerCase() || user.email === identifier) &&
                user.password === password
            );

            if (user) {
                setCurrentUser(user);
                localStorage.setItem('user', JSON.stringify(user));
                navigate('/');
            } else {
                setError('Invalid username/email or password');
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setError('Error fetching users');
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                    <label htmlFor="identifier">Username or Email</label>
                    <input
                        type="text"
                        id="identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter your username or email"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit" className="login-button">Login</button>
                <Link to="/sign-up">If you don't have a user, let's create one</Link>
            </form>
        </div>
    );
};

export default Login;
