import React, { useState } from 'react';
import axios from 'axios';

function SignUp() {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        city: '',
        hobbies: '',
        password: '',
        nickname: '',
        username: '',
        role: 'visitor',
        image: null,
        email: '',
        backgroundImage: null 
    });

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData({ ...formData, [name]: files[0] });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSignUp = async () => {
        const formDataToSend = new FormData();
        for (const key in formData) {
            if (formData[key] !== null) {
                formDataToSend.append(key, formData[key]);
            }
        }

        try {
            const response = await axios.post('http://localhost:3000/create-user', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage('User created successfully');
            setMessageType('success');
            console.log(response.data.message);
        } catch (error) {
            setMessage('Error saving data: ' + (error.response?.data?.error || error.message));
            setMessageType('error');
            console.error('Error saving data:', error);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="mb-4">Sign Up</h2>
            <div className="form-group">
                <label htmlFor="backgroundImage">Upload Background Profile Image</label>
                <input
                    type="file"
                    id="backgroundImage"
                    name="backgroundImage"
                    className="form-control-file"
                    onChange={handleFileChange}
                />
                {formData.backgroundImage && (
                    <img
                        src={URL.createObjectURL(formData.backgroundImage)}
                        alt="Background Preview"
                        className="bg-preview"
                    />
                )}
            </div>
            <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                    type="number"
                    id="age"
                    name="age"
                    className="form-control"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                    type="text"
                    id="city"
                    name="city"
                    className="form-control"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="hobbies">Hobbies</label>
                <input
                    type="text"
                    id="hobbies"
                    name="hobbies"
                    className="form-control"
                    placeholder="Hobbies (comma separated)"
                    value={formData.hobbies}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="nickname">Nickname</label>
                <input
                    type="text"
                    id="nickname"
                    name="nickname"
                    className="form-control"
                    placeholder="Nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label htmlFor="image">Upload Profile Image</label>
                <input
                    type="file"
                    id="image"
                    name="image"
                    className="form-control-file"
                    onChange={handleFileChange}
                />
            </div>
            <button className="btn btn-primary mt-3" onClick={handleSignUp}>Sign Up</button>
            {message && (
                <p className={`mt-3 ${messageType === 'success' ? 'text-success' : 'text-danger'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default SignUp;
