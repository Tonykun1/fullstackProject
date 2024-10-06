const express = require('express');
const fs = require('fs');
const fsPromises = require('fs').promises; 
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const port = 3000;
const http = require('http');
const socketIo = require('socket.io');

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
    }
  });
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  }));
  app.use(cors({
    origin: 'http://localhost:5173'
  }));
  app.use(cors());
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    console.log("Token received:", token);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};



const dataFilePath = path.join(__dirname, 'Data', 'users.json');
const imageStoragePath = path.join(__dirname, 'public', 'images');
const dataPostFilePath = path.join(__dirname, 'Data', 'Post.json');
const fileChatPath = path.join(__dirname, 'Data', 'Chat.json');
const chatDir = path.join(__dirname, 'chat_files');
const readUsersData = () => {
    try {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading user data:', error);
      throw error;
    }
  };
  const findReplyById = (replies, replyId) => {
    for (const reply of replies) {
        if (reply.id === replyId) {
            return reply;
        }
        const nestedReply = findReplyById(reply.replies, replyId);
        if (nestedReply) {
            return nestedReply;
        }
    }
    return null;
};

  const writeUsersData = (data) => {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing user data:', error);
      throw error;
    }
  };
  const readPostsData = () => {
      const data = fs.readFileSync(dataPostFilePath, 'utf8');
      return JSON.parse(data);
  };
  
  const writePostsData = (data) => {
      fs.writeFileSync(dataPostFilePath, JSON.stringify(data, null, 2), 'utf8');
  };
  
app.use('/images', express.static(imageStoragePath));
function addMessage(message, res) {
    fs.readFile(fileChatPath, 'utf8', (readErr, data) => {
        if (readErr) {
            return res.status(500).send('Error reading chat file');
        }

        const messages = JSON.parse(data);
        messages.push(message);

        fs.writeFile(fileChatPath, JSON.stringify(messages), (writeErr) => {
            if (writeErr) {
                return res.status(500).send('Error writing chat file');
            }

            res.status(200).send('Message saved');
        });
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(imageStoragePath)) {
            fs.mkdirSync(imageStoragePath, { recursive: true });
        }
        cb(null, imageStoragePath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

const upload = multer({ storage: storage });

// Create a new user
app.post('/create-user', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'backgroundImage', maxCount: 1 }]), (req, res) => {
    const { name, age, city, hobbies, password, nickname, username, role, email } = req.body;
    const image = req.files['image'] ? `/images/${req.files['image'][0].filename}` : null;
    const backgroundImage = req.files['backgroundImage'] ? `/images/${req.files['backgroundImage'][0].filename}` : null;

    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ error: 'Failed to parse data' });
        }

        const newUser = {
            id: uuidv4(),
            name,
            age,
            city,
            hobbies,
            password,
            nickname,
            username,
            role,
            email,
            image,
            backgroundImage
        };

        users.push(newUser);

        fs.writeFile(dataFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ error: 'Failed to write data' });
            }
            res.status(201).json({ message: 'User created successfully', user: newUser });
        });
    });
});

// Get all users
app.get('/get-users', (req, res) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }
        try {
            const users = JSON.parse(data);
            res.json(users);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ error: 'Failed to parse data' });
        }
    });
});

// Get a specific user by username
app.get('/get-user/:username', (req, res) => {
    const username = req.params.username;
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ error: 'Failed to parse data' });
        }

        const user = users.find(user => user.username.toLowerCase() === username.toLowerCase());
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

// Update a user
app.put('/update-user/:username', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'backgroundImage', maxCount: 1 }]), (req, res) => {
    const username = req.params.username;
    const { nickname, email, password } = req.body;

    const image = req.files['image'] ? `/images/${req.files['image'][0].filename}` : null;
    const backgroundImage = req.files['backgroundImage'] ? `/images/${req.files['backgroundImage'][0].filename}` : null;

    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ error: 'Failed to parse data' });
        }

        const userIndex = users.findIndex(user => user.username.toLowerCase() === username.toLowerCase());
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedUser = {
            ...users[userIndex],
            nickname: nickname || users[userIndex].nickname,
            email: email || users[userIndex].email,
            password: password || users[userIndex].password,
            image: image || users[userIndex].image,
            backgroundImage: backgroundImage || users[userIndex].backgroundImage
        };

        users[userIndex] = updatedUser;

        fs.writeFile(dataFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ error: 'Failed to write data' });
            }
            res.json(updatedUser);
        });
    });
});

// Get all posts
app.get('/get-posts', (req, res) => {
    fs.readFile(dataPostFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }
        try {
            const posts = JSON.parse(data);
            res.json(posts);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ error: 'Failed to parse data' });
        }
    });
});
//post by id
app.get('/posts/:id', (req, res) => {
    const { id } = req.params;
    fs.readFile(dataPostFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let posts = [];
        try {
            posts = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ error: 'Failed to parse data' });
        }

        const post = posts.find(post => post.id === id);
        if (post) {
            res.json(post);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    });
});
app.get('/get-posts/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        let posts = JSON.parse(data);

        const userPosts = posts.filter(post => post.username === username);

        
            res.json(userPosts);
       
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});
// Add a new comment to a post
app.post('/posts/:id/comments', async (req, res) => {
    const postId = req.params.id;
    const { content, username } = req.body;

    try {
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        let posts = JSON.parse(data);
        
        const userData = await fs.promises.readFile(dataFilePath, 'utf8');
        const users = JSON.parse(userData);

        const postIndex = posts.findIndex(post => post.id === postId);
        if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });

        const user = users.find(user => user.username === username);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const comment = {
            id: uuidv4(),
            content,
            timestamp: new Date().toISOString(),
            username,
            nickname: user.nickname,
            image: user.image
        };

        posts[postIndex].comments = posts[postIndex].comments || [];
        posts[postIndex].comments.push(comment);

        await fs.promises.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2));

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Update a comment
app.put('/posts/:postId/comments/:commentId', async (req, res) => {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    try {
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        const posts = JSON.parse(data);

        const userData = await fs.promises.readFile(dataFilePath, 'utf8');
        const users = JSON.parse(userData);

        const postIndex = posts.findIndex(post => post.id === postId);
        if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });

        const commentIndex = posts[postIndex].comments.findIndex(comment => comment.id === commentId);
        if (commentIndex === -1) return res.status(404).json({ error: 'Comment not found' });

        const comment = posts[postIndex].comments[commentIndex];
        const user = users.find(user => user.username === comment.username);

        const updatedComment = {
            ...comment,
            content: content || comment.content,
            editTimestamp: new Date().toISOString(), 
            nickname: user ? user.nickname : comment.nickname, 
            image: user ? user.image : comment.image            
        };

        posts[postIndex].comments[commentIndex] = updatedComment;

        await fs.promises.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2));

        res.json(updatedComment);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});



// Delete a comment
app.delete('/posts/:postId/comments/:commentId', (req, res) => {
    const { postId, commentId } = req.params;

    fs.readFile(dataPostFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let posts = [];
        try {
            posts = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ error: 'Failed to parse data' });
        }

        const postIndex = posts.findIndex(post => post.id === postId);
        if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });

        const commentIndex = posts[postIndex].comments.findIndex(comment => comment.id === commentId);
        if (commentIndex === -1) return res.status(404).json({ error: 'Comment not found' });

        const deletedComment = posts[postIndex].comments.splice(commentIndex, 1)[0];

        fs.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ error: 'Failed to write data' });
            }
            res.json(deletedComment);
        });
    });
});
// POST reply to a comment inside a post
app.post('/posts/:postId/comments/:commentId/replies', async (req, res) => {
    const { postId, commentId } = req.params;
    const { content, username } = req.body;

    try {
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        let posts = JSON.parse(data);

        const post = posts.find(post => post.id === postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const comment = post.comments.find(c => c.id === commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const newReply = {
            id: uuidv4(),
            content,
            timestamp: new Date().toISOString(),
            username,
            replies: [] 
        };

        comment.replies = comment.replies || [];
        comment.replies.push(newReply);

        await fs.promises.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2));

        res.status(201).json(newReply);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});


// Add a new post
app.post('/add-post', upload.single('image'), (req, res) => {
    const { title, content, username } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : null;
    const postId = uuidv4();

    fs.readFile(dataPostFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let posts = [];
        try {
            posts = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ error: 'Failed to parse data' });
        }

        const newPost = {
            id: postId,
            title,
            content,
            username, 
            timestamp: new Date().toISOString(),
            image
        };

        posts.push(newPost);

        fs.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ error: 'Failed to write data' });
            }
            res.status(201).json(newPost);
        });
    });
});


// Update a post
app.put('/update-post/:id', upload.single('image'), async (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : null;

    try {
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        const posts = JSON.parse(data);

        const postIndex = posts.findIndex(post => post.id === postId);
        if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });

        const existingPost = posts[postIndex];

        const updatedPost = {
            ...existingPost,
            title: title || existingPost.title,
            content: content || existingPost.content,
            image: image || existingPost.image,
            editTimestamp: new Date().toISOString() 
        };

        posts[postIndex] = updatedPost;

        await fs.promises.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2));

        res.json(updatedPost);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});



// Delete a post
app.delete('/delete-post/:id', (req, res) => {
    const postId = req.params.id;

    fs.readFile(dataPostFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });

        let posts = [];
        try {
            posts = JSON.parse(data);
        } catch (parseError) {
            return res.status(500).json({ error: 'Failed to parse data' });
        }

        posts = posts.filter(post => post.id !== postId);

        fs.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Failed to write data' });
            res.status(204).end();
        });
    });
});

app.get('/posts/:id/comments', async (req, res) => {
    const postId = req.params.id;
    
    try {
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        let posts = JSON.parse(data);

        const post = posts.find(post => post.id === postId);
        if (post) {
            res.json(post.comments || []);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});


  
  // Add friend
  app.post('/add-friend/:username', (req, res) => {
    const { username } = req.params;
    const { friend } = req.body;
    
    const users = readUsersData(); 
  
    const user = users.find(user => user.username === username);
    const friendUser = users.find(user => user.username === friend);
  
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    if (!friendUser) {
      return res.status(404).json({ error: 'Friend user not found' });
    }
    
    if (!user.friends) {
      user.friends = [];
    }
  
    if (user.friends.includes(friend)) {
      return res.status(400).json({ error: 'Already friends' });
    }
  
    user.friends.push(friend);
  
    writeUsersData(users); 
  
    res.status(200).json({ message: 'Friend added successfully' });
  });
  
  app.get('/friends/:username', (req, res) => {
    const { username } = req.params;
    const users = readUsersData();
    const user = users.find(u => u.username === username);
  
    if (user) {
      res.json(user.friends || []);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
  // Get friends of a user by username
  app.get('/friends/:username', (req, res) => {
    const { username } = req.params;
    const users = readUsersData();
    const user = users.find(u => u.username === username);
  
    if (user) {
      res.json(user.friends || []);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
  
  // Delete a friend
  app.delete('/delete-friend/:username', (req, res) => {
  const { username } = req.params;
  const { friend } = req.query; 

  if (!friend) {
    return res.status(400).json({ message: 'Friend parameter is required' });
  }

  let users = readUsersData();
  const user = users.find(u => u.username === username);

  if (user) {
    if (!user.friends) user.friends = [];

    const friendIndex = user.friends.indexOf(friend);
    if (friendIndex > -1) {
      user.friends.splice(friendIndex, 1);
      fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2), 'utf8');
      res.json({ message: 'Friend removed successfully', user });
    } else {
      res.status(404).json({ message: 'Friend not found in user\'s friend list' });
    }
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});
app.post('/save-chat', async (req, res) => {
    const { content, sender, recipient, image } = req.body;

    if (!content || !sender || !recipient || !image) {
        return res.status(400).send('Invalid message format');
    }

    try {
        let data = await fsPromises.readFile(fileChatPath, 'utf8');
        let messages = JSON.parse(data);

        messages.push({ id: uuidv4(), content, sender, recipient, image });

        await fsPromises.writeFile(fileChatPath, JSON.stringify(messages, null, 2));
        res.status(200).send('Message saved');
        
    } catch (error) {
        console.error('Error reading or writing Chat.json:', error);
        res.status(500).send('Error processing request');
    }
});

app.get('/fetch-chat', async (req, res) => {
    const { nickname } = req.query;

    if (!nickname) {
        return res.status(400).send('Nickname is required');
    }

    try {
        let data = await fsPromises.readFile(fileChatPath, 'utf8');
        let messages = JSON.parse(data);

        const filteredMessages = messages.filter(
            msg => (msg.sender === nickname || msg.recipient === nickname)
        );

        res.status(200).json(filteredMessages);
        
    } catch (error) {
        console.error('Error reading chat file:', error);
        res.status(500).send('Error processing request');
    }
});

  
  
  
  
app.get('/post/:postId/comments/:commentId/Reply', (req, res) => {
    const { postId, commentId } = req.params;

    try {
        const posts = readPostsData(); 
        const post = posts.find(p => p.id === postId);

        if (!post) {
            console.log('Post not found:', postId);
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = post.comments.find(c => c.id === commentId);

        if (!comment) {
            console.log('Comment not found:', commentId);
            return res.status(404).json({ error: 'Comment not found' });
        }

        console.log('Replies found:', comment.replies);
        res.status(200).json(comment.replies || []);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Add a new reply to a comment or another reply 
app.post('/posts/:id/comments/:commentId/replies', async (req, res) => {
    const { id, commentId } = req.params;
    const { content, username } = req.body;

    try {
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        let posts = JSON.parse(data);

        const post = posts.find(post => post.id === id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const addReplyToComment = (comments, commentId) => {
            for (let comment of comments) {
                if (comment.id === commentId) {
                    comment.replies = comment.replies || [];
                    comment.replies.push({
                        id: uuidv4(),
                        content,
                        username,
                        timestamp: new Date().toISOString(),
                        replies: []
                    });
                    return true; 
                }
                if (comment.replies && comment.replies.length > 0) {
                    const replyAdded = addReplyToComment(comment.replies, commentId);
                    if (replyAdded) return true;
                }
            }
            return false;
        };

        const commentFound = addReplyToComment(post.comments, commentId);
        if (!commentFound) return res.status(404).json({ error: 'Comment not found' });

        await fs.promises.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2));

        res.status(201).json({ message: 'Reply added successfully' });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});


app.put('/posts/:postId/comments/:commentId/replies/:replyId', async (req, res) => {
    const { postId, commentId, replyId } = req.params;
    const { content } = req.body;

    try {
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        let posts = JSON.parse(data);

        const post = posts.find(post => post.id === postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const updateReplyInComment = (comments, commentId, replyId, newContent) => {
            for (let comment of comments) {
                if (comment.id === commentId) {
                    const reply = comment.replies.find(r => r.id === replyId);
                    if (reply) {
                        reply.content = newContent;
                        reply.editTimestamp = new Date().toISOString();
                        return true; 
                    }
                }
                if (comment.replies && comment.replies.length > 0) {
                    const replyUpdated = updateReplyInComment(comment.replies, commentId, replyId, newContent);
                    if (replyUpdated) return true;
                }
            }
            return false;
        };

        const replyUpdated = updateReplyInComment(post.comments, commentId, replyId, content);
        if (!replyUpdated) return res.status(404).json({ error: 'Reply not found' });

        await fs.promises.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2));

        res.json({ message: 'Reply updated successfully' });
    } catch (error) {
        console.error('Error updating reply:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

  
app.delete('/posts/:postId/comments/:commentId/replies/:replyId', async (req, res) => {
    const { postId, commentId, replyId } = req.params;

    try {
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        let posts = JSON.parse(data);

        const post = posts.find(post => post.id === postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const deleteReplyFromComment = (comments, commentId, replyId) => {
            for (let comment of comments) {
                if (comment.id === commentId) {
                    const replyIndex = comment.replies.findIndex(reply => reply.id === replyId);
                    if (replyIndex !== -1) {
                        comment.replies.splice(replyIndex, 1); 
                        return true;
                    }
                }
                if (comment.replies && comment.replies.length > 0) {
                    const replyDeleted = deleteReplyFromComment(comment.replies, commentId, replyId);
                    if (replyDeleted) return true;
                }
            }
            return false;
        };

        const replyDeleted = deleteReplyFromComment(post.comments, commentId, replyId);
        if (!replyDeleted) return res.status(404).json({ error: 'Reply not found' });

        await fs.promises.writeFile(dataPostFilePath, JSON.stringify(posts, null, 2));

        res.json({ message: 'Reply deleted successfully' });
    } catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});



app.get('/search-posts', async (req, res) => {
    const { title } = req.query;

    try {
        
        const data = await fs.promises.readFile(dataPostFilePath, 'utf8');
        let posts = JSON.parse(data);

       
        if (title) {
            posts = posts.filter(post => post.title && post.title.toLowerCase().includes(title.toLowerCase()));
        }

        
        const postsWithUserDetails = await Promise.all(posts.map(async post => {
            try {
                const userResponse = await fetch(`http://localhost:3000/get-user/${post.username}`);
                if (userResponse.ok) {
                    const userDetails = await userResponse.json();
                    return { ...post, user: userDetails };
                }
                return post;
            } catch (error) {
                console.error('Failed to fetch user details:', error);
                return post;
            }
        }));

        res.json(postsWithUserDetails);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});
app.post('/posts/:id/comments/:commentId/replies', (req, res) => {
    const { id, commentId } = req.params;
    const { content, username } = req.body;

    const posts = readPostsData();
    const post = posts.find(post => post.id === id);

    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.find(comment => comment.id === commentId);

    if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    const newReply = {
        id: uuidv4(),
        content,
        username,
        timestamp: new Date().toISOString(),
        replies: [],
    };

    comment.replies = [...(comment.replies || []), newReply];

    try {
        writePostsData(posts);
        res.status(201).json(newReply);
    } catch (err) {
        console.error('Error writing posts data:', err);
        res.status(500).json({ error: 'Failed to save reply' });
    }
});

app.post('/posts/:id/comments/:commentId/replies/:replyId', (req, res) => {
    const { id, commentId, replyId } = req.params;
    const { content, username } = req.body;

    const posts = readPostsData();
    const post = posts.find(post => post.id === id);

    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.find(comment => comment.id === commentId);

    if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    const newReply = {
        id: uuidv4(),
        content,
        username,
        timestamp: new Date().toISOString(),
        replies: [],
    };

    const reply = findReplyById(comment.replies, replyId);

    if (reply) {
        reply.replies = [...(reply.replies || []), newReply];
    } else {
        return res.status(404).json({ error: 'Reply not found' });
    }

    try {
        writePostsData(posts);
        res.status(201).json(newReply);
    } catch (err) {
        console.error('Error writing posts data:', err);
        res.status(500).json({ error: 'Failed to save reply' });
    }
});
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join room', ({ sender, recipient }) => {
        socket.join(sender);
        socket.join(recipient);
        console.log(`${sender} and ${recipient} joined the chat room`);
    });

    socket.on('chat message', async (message) => {
        try {
            io.to(message.recipient).emit('chat message', message);
            console.log(`Message sent from ${message.sender} to ${message.recipient}`);

            try {
                let data = await fsPromises.readFile(fileChatPath, 'utf8');
                let messages = JSON.parse(data);

                messages.push({ id: uuidv4(), ...message });

                await fsPromises.writeFile(fileChatPath, JSON.stringify(messages, null, 2));
                console.log('Chat message saved to Chat.json');
                
            } catch (readWriteErr) {
                console.error('Error reading or writing Chat.json:', readWriteErr);
            }

        } catch (error) {
            console.error('Error sending chat message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

