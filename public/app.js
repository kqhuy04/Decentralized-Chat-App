// React Components
const { useState, useEffect, useRef } = React;

// Main App Component
function App() {
    const [theme, setTheme] = useState('light');
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showGroupManagement, setShowGroupManagement] = useState(false);
    const [voiceMessage, setVoiceMessage] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const messagesEndRef = useRef(null);
    const videoRef = useRef(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);
    const typingTimeout = useRef(null);

    // Add new state variables for 3D effects
    const [is3DMode, setIs3DMode] = useState(false);
    const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 5 });
    const [sceneRotation, setSceneRotation] = useState({ x: 0, y: 0, z: 0 });
    const [particleColor, setParticleColor] = useState('#4f46e5');
    const [isHolographic, setIsHolographic] = useState(false);
    const [isNeonMode, setIsNeonMode] = useState(false);
    const [isMatrixMode, setIsMatrixMode] = useState(false);

    // Add new refs for 3D scene
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);

    // Theme toggle with smooth transition
    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            document.body.dataset.theme = newTheme;
            return newTheme;
        });
    };

    // Connect to MetaMask with loading state
    const connectMetaMask = async () => {
        setIsLoading(true);
        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask!');
            }

            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found");
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            
            setUserAddress(address);
            setIsConnected(true);
            showNotification("Successfully connected to MetaMask!", "success");
        } catch (error) {
            setError(error.message);
            showNotification(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Send message with animation
    const sendMessage = async (content, recipient) => {
        if (!content.trim()) return;
        
        const newMessage = {
            id: Date.now(),
            content,
            sender: userAddress,
            recipient,
            timestamp: Date.now(),
            status: 'sending'
        };

        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();

        try {
            // Simulate sending message
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setMessages(prev => prev.map(msg => 
                msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
            ));
            
            showNotification("Message sent successfully!", "success");
        } catch (error) {
            setMessages(prev => prev.map(msg => 
                msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg
            ));
            showNotification("Failed to send message", "error");
        }
    };

    // Voice message recording
    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setVoiceMessage(audioUrl);
            };

            mediaRecorder.start();
            setVoiceMessage('recording');
        } catch (error) {
            showNotification("Failed to start recording", "error");
        }
    };

    // Video call functionality
    const startVideoCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            setShowVideoCall(true);

            // Initialize peer connection
            const peer = new SimplePeer({
                initiator: true,
                stream: stream
            });

            peer.on('signal', data => {
                // Send signal data to other peer
                console.log('Signal data:', data);
            });

            peer.on('stream', stream => {
                // Handle incoming stream
                console.log('Received stream:', stream);
            });

            peerRef.current = peer;
        } catch (error) {
            showNotification("Failed to start video call", "error");
        }
    };

    // File upload handling
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFilePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Emoji picker
    const handleEmojiSelect = (emoji) => {
        const input = document.querySelector('.message-input input');
        if (input) {
            input.value += emoji.native;
            setShowEmojiPicker(false);
        }
    };

    // Typing indicator
    const handleTyping = () => {
        setIsTyping(true);
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }
        typingTimeout.current = setTimeout(() => {
            setIsTyping(false);
        }, 3000);
    };

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Show notification with animation
    const showNotification = (message, type = 'info') => {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type} show`;
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
        };
    }, []);

    // Initialize Three.js scene
    useEffect(() => {
        if (is3DMode && window.THREE) {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            
            renderer.setSize(window.innerWidth, window.innerHeight);
            sceneRef.current = scene;
            cameraRef.current = camera;
            rendererRef.current = renderer;
            
            document.body.appendChild(renderer.domElement);
            
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            
            // Add directional light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            scene.add(directionalLight);
            
            // Add particles
            const particlesGeometry = new THREE.BufferGeometry();
            const particlesCount = 5000;
            const posArray = new Float32Array(particlesCount * 3);
            
            for(let i = 0; i < particlesCount * 3; i++) {
                posArray[i] = (Math.random() - 0.5) * 5;
            }
            
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            const particlesMaterial = new THREE.PointsMaterial({
                size: 0.005,
                color: particleColor
            });
            
            const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
            scene.add(particlesMesh);
            
            // Animation loop
            const animate = () => {
                requestAnimationFrame(animate);
                
                particlesMesh.rotation.x += 0.0005;
                particlesMesh.rotation.y += 0.0005;
                
                renderer.render(scene, camera);
            };
            
            animate();
            
            return () => {
                if (renderer.domElement && document.body.contains(renderer.domElement)) {
                    document.body.removeChild(renderer.domElement);
                }
            };
        }
    }, [is3DMode, particleColor]);

    // Add new UI components
    const render3DControls = () => (
        <div className="3d-controls">
            <button 
                className="micro-interaction"
                onClick={() => setIs3DMode(!is3DMode)}
            >
                {is3DMode ? 'Exit 3D Mode' : 'Enter 3D Mode'}
            </button>
            <button 
                className="micro-interaction"
                onClick={() => setIsHolographic(!isHolographic)}
            >
                {isHolographic ? 'Disable Holographic' : 'Enable Holographic'}
            </button>
            <button 
                className="micro-interaction"
                onClick={() => setIsNeonMode(!isNeonMode)}
            >
                {isNeonMode ? 'Disable Neon' : 'Enable Neon'}
            </button>
            <button 
                className="micro-interaction"
                onClick={() => setIsMatrixMode(!isMatrixMode)}
            >
                {isMatrixMode ? 'Disable Matrix' : 'Enable Matrix'}
            </button>
        </div>
    );

    // Add new message effects
    const renderMessageWithEffects = (message) => (
        <div 
            className={`message ${message.sender === userAddress ? 'sent' : 'received'} hover-scale`}
            data-aos="fade-up"
            style={{
                transform: is3DMode ? 'translateZ(20px)' : 'none',
                filter: isNeonMode ? 'drop-shadow(0 0 10px var(--primary))' : 'none',
                textShadow: isMatrixMode ? '0 0 5px #00ff00' : 'none'
            }}
        >
            <div className="message-content">
                {message.content}
                {message.file && (
                    <img 
                        src={message.file} 
                        alt="Attachment" 
                        className="file-preview"
                        style={{
                            filter: isHolographic ? 'hue-rotate(90deg)' : 'none'
                        }}
                    />
                )}
                {message.voice && (
                    <div className="voice-message">
                        <audio controls src={message.voice}></audio>
                    </div>
                )}
                <div className="message-actions">
                    <button 
                        className="micro-interaction"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        😊
                    </button>
                </div>
                <div className="message-status">
                    {message.status === 'sending' ? '🔄' : 
                     message.status === 'failed' ? '❌' : '✓'}
                </div>
            </div>
            <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
            </div>
        </div>
    );

    return (
        <div className={`container ${theme} ${is3DMode ? '3d-mode' : ''}`}>
            {render3DControls()}
            <div className="sidebar glass-effect">
                <div className="profile-section hover-scale three-d-effect" onClick={() => setShowProfileModal(true)}>
                    <div className="profile-avatar gradient-text">👤</div>
                    <div className="profile-info">
                        <div className="profile-name">{userAddress ? truncateAddress(userAddress) : 'Anonymous'}</div>
                        <div className="profile-bio">No bio yet</div>
                    </div>
                </div>

                <div className="sidebar-header">
                    <h2 className="gradient-text">Chats</h2>
                    <div className="button-group">
                        <button 
                            className="theme-toggle micro-interaction" 
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                        <button 
                            id="connectButton" 
                            className={`micro-interaction ${isConnected ? 'connected' : ''}`}
                            onClick={connectMetaMask}
                            disabled={isConnected}
                            aria-label="Connect MetaMask"
                        >
                            {isLoading ? (
                                <div className="loading-spinner"></div>
                            ) : (
                                <span>{isConnected ? 'Connected' : 'Connect MetaMask'}</span>
                            )}
                        </button>
                    </div>
                </div>

                <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Search conversations..." 
                    aria-label="Search conversations"
                />

                {error && (
                    <div className="error-boundary">
                        {error}
                    </div>
                )}

                <div className="conversation-list custom-scrollbar">
                    {/* Conversation items will be rendered here */}
                </div>
            </div>

            <div className="chat-area glass-effect">
                <div className="chat-header">
                    <h3 className="gradient-text">
                        {currentChat ? truncateAddress(currentChat) : 'Select a conversation'}
                    </h3>
                    {currentChat && (
                        <button 
                            className="micro-interaction"
                            onClick={() => setShowVideoCall(true)}
                        >
                            📹
                        </button>
                    )}
                </div>

                <div className="messages custom-scrollbar">
                    {messages.map(message => renderMessageWithEffects(message))}
                    {isTyping && (
                        <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="message-input">
                    <input 
                        type="file" 
                        className="file-upload" 
                        onChange={handleFileUpload}
                        accept="image/*,audio/*,video/*"
                    />
                    <button 
                        className="micro-interaction"
                        onClick={() => document.querySelector('.file-upload').click()}
                    >
                        📎
                    </button>
                    <button 
                        className="micro-interaction"
                        onClick={startVoiceRecording}
                    >
                        🎤
                    </button>
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        onKeyPress={e => {
                            if (e.key === 'Enter' && currentChat) {
                                sendMessage(e.target.value, currentChat);
                                e.target.value = '';
                            }
                        }}
                        onInput={handleTyping}
                    />
                    <button 
                        className="micro-interaction"
                        onClick={() => {
                            const input = document.querySelector('.message-input input');
                            if (input.value && currentChat) {
                                sendMessage(input.value, currentChat);
                                input.value = '';
                            }
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>

            {/* Video Call Modal */}
            {showVideoCall && (
                <div className="video-call">
                    <div className="video-container">
                        <div className="video-participant">
                            <video ref={videoRef} autoPlay muted></video>
                        </div>
                    </div>
                    <div className="video-controls">
                        <button className="micro-interaction">🎤</button>
                        <button className="micro-interaction">📹</button>
                        <button 
                            className="micro-interaction"
                            onClick={() => setShowVideoCall(false)}
                        >
                            ❌
                        </button>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="profile-modal">
                    <div className="profile-content">
                        <h2>Edit Profile</h2>
                        <input type="text" placeholder="Username" />
                        <textarea placeholder="Bio"></textarea>
                        <input type="file" accept="image/*" />
                        <button className="micro-interaction">Save</button>
                        <button 
                            className="micro-interaction"
                            onClick={() => setShowProfileModal(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Group Management */}
            {showGroupManagement && (
                <div className="group-management show">
                    <h2>Group Members</h2>
                    <div className="group-members"></div>
                    <button 
                        className="micro-interaction"
                        onClick={() => setShowGroupManagement(false)}
                    >
                        Close
                    </button>
                </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className="emoji-picker">
                    <emoji-picker onEmojiSelect={handleEmojiSelect}></emoji-picker>
                </div>
            )}
        </div>
    );
}

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Helper functions
function truncateAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ... rest of your existing code ...