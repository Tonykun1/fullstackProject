import React, { useContext, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import GlobelContext from '../Context/GlobalContext.jsx';
import './Post.css';

const AddPost = () => {
    const { addPost, currentUser } = useContext(GlobelContext);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [error, setError] = useState('');

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size exceeds 5MB.');
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                setError('Unsupported file type.');
                return;
            }
            setImage(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (!title || !content) {
            setError('Title and content are required.');
            return;
        }
    
        if (!currentUser) {
            setError('User is not authenticated.');
            return;
        }
    
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('username', currentUser.username);
        if (image) {
            formData.append('image', image);
        }
    
        try {
            const response = await fetch('http://localhost:3000/add-post', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                },
            });
    
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const newPost = await response.json();
                    addPost(newPost);
                    setTitle('');
                    setContent('');
                    setImage(null);
                    setImagePreview('');
                    setError('');
                } else {
                    setError('Server response is not in JSON format.');
                }
            } else {
                const errorText = await response.text();
                setError(`Failed to create post: ${errorText}`);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            setError('An unexpected error occurred.');
        }
    };

    return (
        <div className="container">
            <h2>Create a Post</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>UserName:</label>
                    <span className="px-1">{currentUser.nickname}</span>
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <Editor
                        apiKey="009wted466lqv2vfqhfojkoumppv1u98nmn6uyqnf93fik3i" 
                        value={content}
                        init={{
                            height: 400,
                            menubar: true,
                            plugins: [
                                'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount',
                                'link image media code'
                            ],
                            toolbar: [
                                'undo redo | formatselect fontselect fontsizeselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                                'link image media'
                            ],
                            content_style: 'body { font-family:Arimo, sans-serif; font-size:14px }',
                            font_formats: 'Arimo=Arimo; Roboto=Roboto; Serif=serif; Sans Serif=sans-serif',
                            fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt',
                            image_title: true,
                            automatic_uploads: true,
                            file_picker_types: 'image',
                            file_picker_callback: function(cb, value, meta) {
                                
                            },
                        }}
                        onEditorChange={setContent}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageChange}
                        aria-label="Upload an image"
                    />
                    {imagePreview && (
                        <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="img-thumbnail mt-2" 
                            aria-label="Image preview" 
                        />
                    )}
                </div>
                <button type="submit" className="btn btn-primary">Post</button>
            </form>
        </div>
    );
};

export default AddPost;
