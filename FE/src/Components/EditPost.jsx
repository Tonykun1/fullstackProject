import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const EditPost = ({ post, onSave, onCancel, token }) => {
    const [updatedTitle, setUpdatedTitle] = useState(post.title);
    const [updatedContent, setUpdatedContent] = useState(post.content);
    const [newImage, setNewImage] = useState(null);
    const [error, setError] = useState('');

    const handleImageChange = (e) => {
        setNewImage(e.target.files[0]);
    };

    const handleSaveEdit = async () => {
        const formData = new FormData();
        formData.append('title', updatedTitle);
        formData.append('content', updatedContent);  // Keep the HTML content as it is
        if (newImage) {
            formData.append('image', newImage);
        }
    
        try {
            const response = await axios.put(`http://localhost:3000/update-post/${post.id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            if (response.status === 200) {
                onSave({
                    ...post,
                    title: updatedTitle,
                    content: updatedContent,  
                    image: newImage ? response.data.image : post.image,
                    editTimestamp: new Date().toISOString(),
                });
                setError('');
            } else {
                setError('Failed to update post. Please try again.');
            }
        } catch (error) {
            console.error('Error updating post:', error);
            setError('Failed to update post. Please try again.');
        }
    };

    return (
        <div className="container mt-4">
            <div className="card p-4 shadow-sm">
                <div className="card-body">
                    <h4 className="card-title mb-3">Edit Post</h4>
                    <div className="mb-3">
                        <label htmlFor="title" className="form-label fw-bold">Title</label>
                        <input
                            id="title"
                            type="text"
                            className="form-control"
                            value={updatedTitle}
                            onChange={(e) => setUpdatedTitle(e.target.value)}
                            placeholder="Enter the post title"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="content" className="form-label fw-bold">Content</label>
                        <ReactQuill
                            value={updatedContent}
                            onChange={setUpdatedContent}
                            placeholder="Enter the post content"
                            modules={{
                                toolbar: [
                                    [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                                    [{size: []}],
                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                    [{'list': 'ordered'}, {'list': 'bullet'}, 
                                    {'indent': '-1'}, {'indent': '+1'}],
                                    ['link', 'image'],
                                    ['clean']
                                ],
                            }}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="image" className="form-label fw-bold">Upload Image</label>
                        <input
                            id="image"
                            type="file"
                            className="form-control"
                            onChange={handleImageChange}
                        />
                    </div>
                    <div className="d-flex justify-content-end">
                        <button
                            className="btn btn-primary me-2"
                            onClick={handleSaveEdit}
                        >
                            Save
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    </div>
                    {error && <p className="text-danger mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default EditPost;
