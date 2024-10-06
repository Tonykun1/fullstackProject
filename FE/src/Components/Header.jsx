import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import GlobalContext from '../Context/GlobalContext.jsx';
import axios from 'axios';
import { Button, InputGroup, FormControl, Dropdown } from 'react-bootstrap';

const Header = () => {
  const { currentUser, setCurrentUser } = useContext(GlobalContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpenFriends, setDropdownOpenFriends] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const navigate = useNavigate();

  const dropdownRef = useRef(null);
  const dropdownFriendsRef = useRef(null);
  const dropdownSreachRef=useRef(null);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleDropdownFriends = () => setDropdownOpenFriends(!dropdownOpenFriends);
  const handleSignOut = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/login');
  };
  const getTextDirection = (text) => {
    const isHebrew = /[\u0590-\u05FF]/.test(text);
    return isHebrew ? 'rtl' : 'ltr';
};
  useEffect(() => {
    const fetchUserAndFriends = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.username) {
          const response = await fetch(`http://localhost:3000/friends/${storedUser.username}`);
          if (!response.ok) console.log('Failed to fetch friends');
          const friendsData = await response.json();

          const friendsWithDetails = await Promise.all(friendsData.map(async (friend) => {
            const friendResponse = await fetch(`http://localhost:3000/get-user/${friend}`);
            if (!friendResponse.ok) console.log('Failed to fetch friend details');
            const friendDetails = await friendResponse.json();
            return friendDetails;
          }));

          setFriends(friendsWithDetails);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndFriends();
  }, [currentUser]);

  const handleDeleteFriend = async (friendNickname) => {
    try {
      const response = await axios.delete(`http://localhost:3000/delete-friend/${currentUser.username}?friend=${friendNickname}`, {
        headers: { 'Authorization': `Bearer ${currentUser.token}` },
      });

      if (response.status === 200) {
        setCurrentUser(prev => ({
          ...prev,
          friends: prev.friends.filter(friend => friend !== friendNickname)
        }));
        setFriends(friends.filter(friend => friend.nickname !== friendNickname));
      }
    } catch (error) {
      console.error('Failed to delete friend:', error);
      setError('Failed to delete friend.');
    }
  };

  const handleSearchChange = async (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
        try {
            const response = await axios.get('http://localhost:3000/search-posts', { params: { title: query } });
            setSearchResults(response.data);
        } catch (error) {
            console.error('Failed to fetch search results:', error);
            setSearchResults([]);
        }
    } else {
        setSearchResults([]);
    }
};
  const handleClickOutside = (e) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target) &&
      dropdownFriendsRef.current &&
      !dropdownFriendsRef.current.contains(e.target)&&
      dropdownSreachRef.current &&
      !dropdownSreachRef.current.contains(e.target)
    ) {
      setDropdownOpen(false);
      setDropdownOpenFriends(false);
      setSearchResults(false)
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <nav className="bg-black dark:bg-gray-900 navbar navbar-expand-lg navbar-dark">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <img
            src="https://flowbite.com/docs/images/logo.svg"
            alt="Flowbite Logo"
            className="d-inline-block align-top"
          />
          Catipkay
        </Link>
        <Button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </Button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/chat" className="nav-link">
              Chat
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/pricing" className="nav-link">
                Pricing
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/contact" className="nav-link">
                Contact
              </Link>
            </li>
            {!currentUser ? (
              <li className="nav-item">
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              </li>
            ) : (
              <li className="nav-item dropdown" ref={dropdownFriendsRef}>
                <Button
                  className="nav-link dropdown-toggle"
                  onClick={toggleDropdownFriends}
                >
                  Friends: {friends.length}
                </Button>
                {dropdownOpenFriends && (
                  <ul className="dropdown-menu show">
                    <h4 className="text-black text-center">Friends List</h4>
                    <ul className="list-unstyled">
                      {friends.map((friend) => (
                        <li
                          key={friend.username}
                          className="d-flex align-items-center"
                        >
                          <Link
                            to={`/profile/${friend.nickname}`}
                            className="text-black d-flex align-items-center link-underline link-underline-opacity-0"
                          >
                            <img
                              src={
                                friend.image
                                  ? `http://localhost:3000${friend.image}`
                                  : "https://via.placeholder.com/50"
                              }
                              alt={`${friend.nickname}'s photo`}
                              className="rounded-circle"
                              style={{ width: "50px", height: "50px" }}
                            />
                            <span className="px-2">{friend.nickname}</span>
                          </Link>
                          <Button
                            onClick={() => handleDeleteFriend(friend.nickname)}
                            className="btn btn-danger btn-sm ml-2"
                          >
                            <i className="bi bi-x-circle"></i>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ul>
                )}
              </li>
            )}
          </ul>
          <div className="d-flex align-items-center">
            <Button
              className="btn btn-outline-light mr-2"
              onClick={() => setSearchExpanded(!searchExpanded)}
            >
              <i className="bi bi-search"></i>
            </Button>
            {searchExpanded && (
              <InputGroup className="search-container">
                <FormControl
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && searchResults.length > 0 && (
                  <ul className="dropdown-menu show search-results">
                    {searchResults.map((post) => (
                      <li key={post.id} className="dropdown-item">
                        <Link
                          className="link-underline link-underline-opacity-0"
                          to={`/posts/${post.id}`}
                        >
                          <div className="d-flex align-items-center ">
                            <div>
                              <img
                                src={
                                  post.user?.image
                                    ? `http://localhost:3000${post.user.image}`
                                    : "https://via.placeholder.com/50"
                                }
                                alt={`${post.user?.nickname}'s photo`}
                                className="rounded-circle"
                                style={{ width: "30px", height: "30px" }}
                              />
                              <span className="px-2">
                                Post by: {post.user?.nickname}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`px-2 ${
                              getTextDirection(post.title) === "rtl"
                                ? "float-end"
                                : "float-start"
                            }`}
                          >
                            {post.title}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </InputGroup>
            )}
            {currentUser && (
              <Dropdown className="user-menu" ref={dropdownRef}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                  <img
                    src={
                      currentUser.image
                        ? `http://localhost:3000${currentUser.image}`
                        : "https://via.placeholder.com/150"
                    }
                    alt="User photo"
                    className="rounded-circle"
                    style={{ width: "50px", height: "50px" }}
                  />
                  <span className="px-3">{currentUser.nickname}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    as={Link}
                    to={`/profile/${currentUser.nickname}`}
                  >
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/settings">
                    Settings
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/add-post">
                    Add Post
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/earnings">
                    Earnings
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleSignOut}>
                    Sign out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
