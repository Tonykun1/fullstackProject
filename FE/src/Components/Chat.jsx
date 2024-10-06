import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import GlobalContext from '../Context/GlobalContext';



const Chat = ({socket}) => {
  const { currentUser } = useContext(GlobalContext);
  const { nickname } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(nickname);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const username = currentUser.username;

  useEffect(() => {
    if (selectedFriend) {
      socket.emit('join room', { sender: username, recipient: selectedFriend });

      const messageListener = (message) => {
        if (message.recipient === selectedFriend || message.sender === selectedFriend) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      };

      socket.on('chat message', messageListener);

      return () => {
        socket.emit('leave room', { sender: username, recipient: selectedFriend });
        socket.off('chat message', messageListener);
      };
    }
  }, [selectedFriend, username, socket]);

  
  

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:3000/friends/${username}`);
        if (!response.ok) throw new Error('Failed to fetch friends');
        const data = await response.json();
        setFriends(data);
      } catch (error) {
        setError('Error fetching friends');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [username]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedFriend) {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`http://localhost:3000/fetch-chat?nickname=${selectedFriend}`);
          if (!response.ok) throw new Error(`Failed to fetch messages: ${response.statusText}`);
          const data = await response.json();
          setMessages(data);
        } catch (error) {
          setError(`Error fetching messages: ${error.message}`);
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMessages();
  }, [selectedFriend]);

  const saveMessage = async (message) => {
    try {
      const response = await fetch('http://localhost:3000/save-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      if (!response.ok) throw new Error('Failed to save chat message');
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (input && selectedFriend) {
      const message = {
        content: input,
        sender: currentUser.username,
        recipient: selectedFriend,
        image: currentUser.image,
      };

      setMessages((prevMessages) => [...prevMessages, message]);

      socket.emit('chat message', message);

      setInput('');
    }
};

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    navigate(`/chat/${friend}`);
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h4>Friends</h4>
            </div>
            <ul className="list-group list-group-flush">
              {loading && <li className="list-group-item">Loading...</li>}
              {error && <li className="list-group-item text-danger">{error}</li>}
              {!loading && !error && (friends.length > 0 ? (
                friends.map((friend, index) => (
                  <li
                    key={index}
                    className={`list-group-item ${selectedFriend === friend ? 'active' : ''}`}
                    onClick={() => handleFriendClick(friend)}
                  >
                    {friend}
                  </li>
                ))
              ) : (
                <li className="list-group-item">No friends found</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4>Chat {selectedFriend ? `with ${selectedFriend}` : ''}</h4>
            </div>
            <div className="card-body">
              {loading && <p>Loading messages...</p>}
              {error && <p className="text-danger">Error loading messages</p>}
              <ul className="list-unstyled">
                {messages.map((msg, index) => (
                  <li key={index} className="border-bottom py-2">
                    <div className="d-flex align-items-center">
                      <img
                        src={`http://localhost:3000${msg.image}`}
                        alt={`${msg.sender}'s avatar`}
                        className="rounded-circle"
                        style={{ width: '40px', height: '40px', marginRight: '10px' }}
                      />
                      <strong>{msg.sender}:</strong> {msg.content}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-footer">
              <form onSubmit={handleSubmit} className="form-inline">
                <input
                  id="input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="form-control mr-2"
                  autoComplete="off"
                  disabled={!selectedFriend}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!input || !selectedFriend}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
