import React, { useState, useRef, useEffect } from "react";

interface Message {
  sender: 'me' | 'other';
  type: 'text' | 'image' | 'gif' | 'voice' | 'file' | 'location' | 'sticker' | 'poll' | 'contact' | 'code' | 'video' | 'document' | 'calendar';
  text: string;
  image?: string;
  gif?: string;
  voice?: {
    url: string;
    duration: number;
  };
  file?: {
    name: string;
    url: string;
    size: number;
    type: string;
  };
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
  sticker?: string;
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
    totalVotes: number;
  };
  contact?: {
    name: string;
    phone: string;
    email?: string;
  };
  code?: {
    language: string;
    content: string;
  };
  video?: {
    url: string;
    thumbnail: string;
    duration: number;
  };
  document?: {
    name: string;
    url: string;
    size: number;
    type: string;
  };
  calendar?: {
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    description?: string;
  };
  time: string;
  reactions?: { [key: string]: string[] };
  replyTo?: number | null;
  forwardedFrom?: string;
}

interface Call {
  id: string;
  type: 'video' | 'audio';
  status: 'incoming' | 'outgoing' | 'ongoing' | 'ended';
  duration: number;
  startTime: string;
  endTime?: string;
  participants: string[];
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  last: string;
  lastTime: string;
  unread: boolean;
  online: boolean;
  messages: Message[];
  themeColor?: string;
  nickname?: string;
  emoji?: string;
}

interface MessageStatus {
  [key: number]: {
    sent: boolean;
    delivered: boolean;
    read: boolean;
  };
}

const defaultAvatar =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const initialChats: Chat[] = [
  {
    id: 1,
    name: "Lũ chó trong box",
    avatar: "https://i.imgur.com/g7I2SXl.png",
    last: "Ăn Lê đã rời khỏi...",
    lastTime: "34 tuần",
    unread: true,
    online: false,
    messages: [
      {
        sender: "me",
        type: "text",
        text: "Hello mọi người! 🖐️",
        time: "15:21 1/5/21",
      },
      {
        sender: "other",
        type: "text",
        text: "Chào bạn!",
        time: "15:26 1/5/21",
      },
    ],
  },
  {
    id: 2,
    name: "Phạm Văn Hưng",
    avatar: defaultAvatar,
    last: "Tin nhắn không hi...",
    lastTime: "3 năm",
    unread: true,
    online: false,
    messages: [
      {
        sender: "me",
        type: "image",
        text: "",
        image: "https://media.giphy.com/media/3orieUR0Qvg5t4CENq/giphy.gif",
        time: "18:37 3/3/21",
      },
      {
        sender: "other",
        type: "text",
        text: "Ảnh đẹp đó! 😊",
        time: "19:02 3/3/21",
      },
    ],
  },
  {
    id: 5,
    name: "Út Động",
    avatar: defaultAvatar,
    online: true,
    last: "http://at4luy.60inf.n...",
    lastTime: "3 năm",
    unread: false,
    messages: [
      {
        sender: "me",
        type: "text",
        text:
          "Trên gr cũng có cơ td 2l5 chưa phí đấy\nhttps://www.facebook.com/groups/152049752084294/permalink/796815387607724/",
        time: "16:18 9/6/21",
      },
      {
        sender: "me",
        type: "text",
        text: "Um",
        time: "16:18 9/6/21",
      },
      {
        sender: "other",
        type: "text",
        text:
          "http://at4luy.60inf.net/amaz/tb.php?v=ss1623230287518ms\nAmazon 30th anniversary celebration",
        time: "16:18 9/6/21",
      },
      {
        sender: "other",
        type: "gif",
        text: "",
        gif: "https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif",
        time: "16:21 9/6/21",
      },
    ],
  },
  // ... Bạn thêm các chat khác nếu muốn
];

const allEmojis = ["😀", "😂", "😍", "👍", "🙌", "🥳", "🤣", "😭", "😎", "❤️", "👌", "😱", "🦄", "😇", "🤔", "🥰", "😭", "🙏", "🎉", "🥲"];
const sampleGifs = ["https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif","https://media.giphy.com/media/3orieUR0Qvg5t4CENq/giphy.gif","https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif"];

function MessengerUI() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [currentChat, setCurrentChat] = useState<Chat>(chats[2]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [messageStatus, setMessageStatus] = useState<MessageStatus>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{chatId: number, messageIndex: number}[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCustomizeChat, setShowCustomizeChat] = useState(false);
  const [themeColor, setThemeColor] = useState("#0084ff");
  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState("");
  const [showMediaFiles, setShowMediaFiles] = useState(false);
  const [showPrivacySupport, setShowPrivacySupport] = useState(false);
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [blockUser, setBlockUser] = useState(false);
  const [reportUser, setReportUser] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [showCalendarCreator, setShowCalendarCreator] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [selectedContact, setSelectedContact] = useState<{name: string, phone: string, email?: string} | null>(null);
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeContent, setCodeContent] = useState("");
  const [calendarEvent, setCalendarEvent] = useState({
    title: "",
    startTime: "",
    endTime: "",
    location: "",
    description: ""
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // New states for voice messages and calls
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecorder, setVoiceRecorder] = useState<MediaRecorder | null>(null);
  const [voiceChunks, setVoiceChunks] = useState<Blob[]>([]);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [showCallControls, setShowCallControls] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showCallSettings, setShowCallSettings] = useState(false);
  const [callQuality, setCallQuality] = useState<'auto' | 'low' | 'medium' | 'high'>('auto');
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  // Add typing indicator effect
  useEffect(() => {
    if (input) {
      setTyping(true);
      const timer = setTimeout(() => setTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [input]);

  // Add message status tracking
  useEffect(() => {
    const newStatus: MessageStatus = {};
    currentChat.messages.forEach((msg, index) => {
      if (msg.sender === 'me') {
        newStatus[index] = {
          sent: true,
          delivered: true,
          read: index === currentChat.messages.length - 1
        };
      }
    });
    setMessageStatus(newStatus);
  }, [currentChat.messages]);

  // Add search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results: {chatId: number, messageIndex: number}[] = [];
      chats.forEach(chat => {
        chat.messages.forEach((message, index) => {
          if (message.text.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({chatId: chat.id, messageIndex: index});
          }
        });
      });
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, chats]);

  // Swap chat, clear state
  function handleSelectChat(chatId: number) {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      setShowEmoji(false);
      setShowGif(false);
      setInput("");
      setImagePreview(null);
    }
  }

  // Update handleSend to support new message types
  const handleSendMessage = (type: Message['type'], content: any = "") => {
    if (type === "text" && !input.trim()) return;
    
    const newMsg: Message = {
      sender: "me",
      type,
      text: type === "text" ? input : "",
      time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + " " + (new Date().toLocaleDateString('vi')),
      replyTo: replyTo
    };

    // Add content based on message type
    switch(type) {
      case 'voice':
        newMsg.voice = content;
        break;
      case 'file':
        newMsg.file = content;
        break;
      case 'location':
        newMsg.location = content;
        break;
      case 'sticker':
        newMsg.sticker = content;
        break;
      case 'poll':
        newMsg.poll = content;
        break;
      case 'contact':
        newMsg.contact = content;
        break;
      case 'code':
        newMsg.code = content;
        break;
      case 'video':
        newMsg.video = content;
        break;
      case 'document':
        newMsg.document = content;
        break;
      case 'calendar':
        newMsg.calendar = content;
        break;
    }
    
    const newChats = chats.map((chat) =>
      chat.id === currentChat.id
        ? { ...chat, messages: [...chat.messages, newMsg], last: newMsg.text || getLastMessagePreview(newMsg), lastTime: "hiện tại" }
        : chat
    );
    
    setChats(newChats);
    setCurrentChat({...currentChat, messages:[...currentChat.messages, newMsg], last: newMsg.text || getLastMessagePreview(newMsg)});
    setInput("");
    setShowEmoji(false);
    setShowGif(false);
    setImagePreview(null);
    setReplyTo(null);
  };

  // Update all handleSend calls to use handleSendMessage
  const stopRecording = () => {
    setIsRecording(false);
    // Stop recording and get audio URL
    const audioUrl = "recorded_audio_url"; // Replace with actual recording logic
    handleSendMessage("voice", audioUrl);
  };

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setSelectedLocation({ lat, lng, name });
    handleSendMessage("location", { lat, lng, name });
    setShowLocationPicker(false);
  };

  const createPoll = () => {
    if (pollQuestion.trim() && pollOptions.some(opt => opt.trim())) {
      const poll = {
        question: pollQuestion,
        options: pollOptions.map(opt => ({ text: opt, votes: 0 })),
        totalVotes: 0
      };
      handleSendMessage("poll", poll);
      setShowPollCreator(false);
      setPollQuestion("");
      setPollOptions(['', '']);
    }
  };

  const handleContactSelect = (contact: {name: string, phone: string, email?: string}) => {
    setSelectedContact(contact);
    handleSendMessage("contact", contact);
    setShowContactPicker(false);
  };

  const handleCodeSend = () => {
    if (codeContent.trim()) {
      handleSendMessage("code", { language: codeLanguage, content: codeContent });
      setShowCodeEditor(false);
      setCodeContent("");
    }
  };

  const handleVideoRecord = () => {
    // Video recording logic here
    const videoUrl = "recorded_video_url"; // Replace with actual recording logic
    handleSendMessage("video", { url: videoUrl, thumbnail: "thumbnail_url", duration: 0 });
    setShowVideoRecorder(false);
  };

  const handleDocumentSelect = (file: File) => {
    const document = {
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type
    };
    handleSendMessage("document", document);
    setShowDocumentPicker(false);
  };

  const handleCalendarCreate = () => {
    if (calendarEvent.title && calendarEvent.startTime && calendarEvent.endTime) {
      handleSendMessage("calendar", calendarEvent);
      setShowCalendarCreator(false);
      setCalendarEvent({
        title: "",
        startTime: "",
        endTime: "",
        location: "",
        description: ""
      });
    }
  };

  // Keep the original handleSend for backward compatibility
  const handleSend = (type: 'text' | 'image' | 'gif' = "text", content: string = "") => {
    handleSendMessage(type, content);
  };

  function handleEmoji(e: string) {
    setInput((prev) => prev + e);
    setShowEmoji(false);
  }

  // --- Image upload ---
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImagePreview(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }
  function handleSendImage() {
    if(imagePreview) handleSend("image", imagePreview);
  }

  // --- GIF send ---
  function handleSendGif(url: string) {
    handleSend("gif", url);
    setShowGif(false);
  }

  function handleReaction(messageIndex: number, reaction: string) {
    const newMessages = [...currentChat.messages];
    if (!newMessages[messageIndex].reactions) {
      newMessages[messageIndex].reactions = {};
    }
    if (!newMessages[messageIndex].reactions![reaction]) {
      newMessages[messageIndex].reactions![reaction] = [];
    }
    if (newMessages[messageIndex].reactions![reaction].includes('me')) {
      newMessages[messageIndex].reactions![reaction] = newMessages[messageIndex].reactions![reaction].filter(u => u !== 'me');
      if (newMessages[messageIndex].reactions![reaction].length === 0) {
        delete newMessages[messageIndex].reactions![reaction];
      }
    } else {
      newMessages[messageIndex].reactions![reaction].push('me');
    }
    setCurrentChat({...currentChat, messages: newMessages});
  }

  function handleDeleteMessage(messageIndex: number) {
    const newMessages = [...currentChat.messages];
    newMessages.splice(messageIndex, 1);
    setCurrentChat({...currentChat, messages: newMessages});
    setSelectedMessage(null);
  }

  function handleForwardMessage(messageIndex: number) {
    const message = currentChat.messages[messageIndex];
    const newMessage: Message = {
      ...message,
      forwardedFrom: currentChat.name,
      time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + " " + (new Date().toLocaleDateString('vi')),
    };
    const newChats = chats.map(chat => 
      chat.id === currentChat.id
        ? { ...chat, messages: [...chat.messages, newMessage], last: newMessage.text || "[Đã chuyển tiếp]", lastTime: "hiện tại" }
        : chat
    );
    setChats(newChats);
    setCurrentChat({...currentChat, messages: [...currentChat.messages, newMessage], last: newMessage.text || "[Đã chuyển tiếp]"});
    setSelectedMessage(null);
  }

  function handleReply(messageIndex: number) {
    setReplyTo(messageIndex);
    setInput(`@${currentChat.messages[messageIndex].sender === 'me' ? 'Bạn' : currentChat.name}: `);
  }

  const handleCustomizeChat = () => {
    const newChats = chats.map(chat => 
      chat.id === currentChat.id
        ? {
            ...chat,
            themeColor: themeColor,
            nickname: nickname,
            emoji: emoji
          }
        : chat
    );
    setChats(newChats);
    setCurrentChat(newChats.find(c => c.id === currentChat.id)!);
    setShowCustomizeChat(false);
  };

  const getMediaFiles = () => {
    const media: {type: 'image' | 'gif' | 'link', content: string, time: string}[] = [];
    currentChat.messages.forEach(msg => {
      if (msg.type === 'image' && msg.image) {
        media.push({type: 'image', content: msg.image, time: msg.time});
      } else if (msg.type === 'gif' && msg.gif) {
        media.push({type: 'gif', content: msg.gif, time: msg.time});
      } else if (msg.text.includes('http')) {
        const links = msg.text.match(/https?:\/\/[^\s]+/g);
        if (links) {
          links.forEach(link => {
            media.push({type: 'link', content: link, time: msg.time});
          });
        }
      }
    });
    return media;
  };

  const getLastMessagePreview = (msg: Message): string => {
    switch(msg.type) {
      case 'voice': return '[Tin nhắn thoại]';
      case 'file': return '[File đính kèm]';
      case 'location': return '[Vị trí]';
      case 'sticker': return '[Sticker]';
      case 'poll': return '[Khảo sát]';
      case 'contact': return '[Liên hệ]';
      case 'code': return '[Code]';
      case 'video': return '[Video]';
      case 'document': return '[Tài liệu]';
      case 'calendar': return '[Sự kiện]';
      default: return msg.text || '[Tin nhắn]';
    }
  };

  // Voice message handlers
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const duration = chunks.reduce((acc, chunk) => acc + chunk.size, 0) / 1000; // Approximate duration
        
        handleSendMessage("voice", {
          url,
          duration: Math.round(duration)
        });
        
        setVoiceChunks([]);
        setIsRecordingVoice(false);
      };
      
      recorder.start();
      setVoiceRecorder(recorder);
      setIsRecordingVoice(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (voiceRecorder && isRecordingVoice) {
      voiceRecorder.stop();
      voiceRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Call handlers
  const startCall = async (type: 'video' | 'audio') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      
      setLocalStream(stream);
      
      const call: Call = {
        id: Date.now().toString(),
        type,
        status: 'outgoing',
        duration: 0,
        startTime: new Date().toISOString(),
        participants: [currentChat.name]
      };
      
      setCurrentCall(call);
      setShowCallControls(true);
      
      // Simulate call connection
      setTimeout(() => {
        setCurrentCall(prev => prev ? { ...prev, status: 'ongoing' } : null);
      }, 2000);
      
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    
    if (currentCall) {
      const endedCall: Call = {
        ...currentCall,
        status: 'ended' as const,
        endTime: new Date().toISOString(),
        duration: Math.floor((new Date().getTime() - new Date(currentCall.startTime).getTime()) / 1000)
      };
      
      setCallHistory(prev => [...prev, endedCall]);
    }
    
    setCurrentCall(null);
    setShowCallControls(false);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
  };

  const handleIncomingCall = (call: Call) => {
    setIncomingCall(call);
    setShowIncomingCall(true);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.type === 'video'
      });
      
      setLocalStream(stream);
      setCurrentCall({ ...incomingCall, status: 'ongoing' });
      setShowCallControls(true);
      setShowIncomingCall(false);
      setIncomingCall(null);
      
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      const rejectedCall: Call = {
        ...incomingCall,
        status: 'ended' as const,
        endTime: new Date().toISOString(),
        duration: 0
      };
      
      setCallHistory(prev => [...prev, rejectedCall]);
      setShowIncomingCall(false);
      setIncomingCall(null);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setLocalStream(stream);
        setIsScreenSharing(true);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: currentCall?.type === 'video'
        });
        setLocalStream(stream);
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const updateCallQuality = (quality: 'auto' | 'low' | 'medium' | 'high') => {
    setCallQuality(quality);
    // Implement quality adjustment logic here
  };

  // Poll handlers
  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateTime: string): string => {
    const date = new Date(dateTime);
    return date.toLocaleString('vi', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentChat.messages.length, currentChat.id]);

  return (
    <div className={(darkMode ? "dark " : "") + "min-h-screen flex flex-col bg-gray-100 dark:bg-[#18191A] transition-colors duration-300"}>
      {/* Header (browser bar simulation) & Light/Dark toggle */}
      <div className={(darkMode ? "bg-[#23272f] text-white" : "bg-[#242526] text-white")+" flex items-center px-4 py-1.5 gap-2 rounded-t-lg w-full"} style={{height:'38px'}}>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-400 rounded-full inline-block" />
          <span className="w-3 h-3 bg-gray-400 rounded-full inline-block" />
          <span className="w-3 h-3 bg-gray-400 rounded-full inline-block" />
        </div>
        <span className="flex-1 mx-3 text-xs bg-[#4a4b50] py-1 px-2 rounded text-gray-200 max-w-md truncate">https://www.messenger.com/t/{currentChat.name.replace(/\s/g,'')}</span>
        <button
          title={darkMode ? "Sáng" : "Tối"}
          className="w-7 h-7 rounded bg-[#4a4b50] flex items-center justify-center mr-2 outline-none"
          onClick={()=>setDarkMode(!darkMode)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            { darkMode
              ? <circle cx="12" cy="12" r="6"/>
              : <g><circle cx="12" cy="12" r="10" /><path d="M12 4v2m0 8v2m8-8h-2m-8 0H4" /></g>
            }
          </svg>
        </button>
      </div>
      {/* Main Messenger Layout */}
      <div className="flex flex-1 gap-3 py-3 px-2 bg-[#f0f2f5] dark:bg-[#18191A] min-h-[calc(100vh-38px)] transition-colors duration-300">
        {/* Sidebar Navigation */}
        <aside className="w-[62px] bg-white dark:bg-[#242526] rounded-lg flex flex-col pt-2 items-center shadow h-full">
          <div className="w-[38px] h-[38px] rounded-[13px] flex items-center justify-center bg-blue-100 mb-3 mt-1">
            <svg className="h-7 w-7 text-blue-500" viewBox="0 0 36 36" fill="currentColor"><circle cx="18" cy="18" r="16" /></svg>
          </div>
          <ul className="flex flex-col gap-6 mb-2 flex-1">
            <li><svg className="h-6 w-6 text-gray-500" viewBox="0 0 36 36" fill="currentColor"><circle cx="18" cy="18" r="16" /></svg></li>
            <li><svg className="h-6 w-6 text-gray-400" viewBox="0 0 36 36" fill="currentColor"><rect x="9" y="9" width="18" height="18" rx="6" /></svg></li>
            <li><svg className="h-6 w-6 text-gray-400" viewBox="0 0 36 36" fill="currentColor"><rect x="9" y="9" width="18" height="18" rx="4" /></svg></li>
            <li><svg className="h-6 w-6 text-gray-400" viewBox="0 0 36 36" fill="currentColor"><rect x="9" y="9" width="18" height="18" rx="9" /></svg></li>
          </ul>
          <div className="mb-2 mt-auto"><img src={defaultAvatar} alt="profile" className="rounded-full w-7 h-7 mx-auto" /></div>
        </aside>

        {/* Chat List Section */}
        <section className="w-[330px] bg-white dark:bg-[#242526] rounded-lg mr-2 shadow flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between py-4 px-5 border-b border-gray-200 dark:border-[#393A3B]">
            <span className="text-2xl font-bold">Đoạn chat</span>
            <button className="w-7 h-7 bg-gray-100 dark:bg-[#393A3B] rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeLinecap="round"/></svg></button>
          </div>
          {/* Search */}
          <div className="px-4 py-3">
            <input 
              className="w-full border-none bg-gray-100 dark:bg-[#292B2C] rounded-full px-4 py-2 text-[15px] placeholder:text-gray-500 outline-none" 
              placeholder="Tìm kiếm trên Messenger" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Chat List */}
          <div className="overflow-y-auto flex-1 px-2 pb-3 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-[#393A3B]">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#393A3B] mb-1 ${currentChat.id===chat.id ? 'bg-gray-100 dark:bg-[#393A3B]' : ''}`}
                onClick={()=>handleSelectChat(chat.id)}
              >
                <div className="relative">
                  <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full" />
                  {chat.online && <span className="absolute bottom-0 right-1.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"/>}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-semibold text-[15px] truncate">{chat.name}</span>
                  <span className="text-gray-500 text-[13px] truncate">{chat.last}</span>
                </div>
                <div className="flex flex-col items-end text-gray-400 w-14">
                  <span className="text-[12px]">{chat.lastTime}</span>
                  {chat.unread ? <span className="w-2 h-2 rounded-full bg-blue-500 mt-1"/> : <span className="h-5"/>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main Chat Section */}
        <main className="flex-1 bg-white dark:bg-[#242526] rounded-lg shadow flex flex-col min-w-[400px] max-w-[700px]">
          {/* Chat Header */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-[#393A3B]">
            <div className="flex items-center gap-2">
              <img src={currentChat.avatar} className="w-11 h-11 rounded-full mr-3" alt={currentChat.name} />
              <div className="flex-1">
                <div className="font-semibold text-[17px] leading-5">
                  {currentChat.name}
                  {currentChat.emoji && <span className="ml-2">{currentChat.emoji}</span>}
                </div>
                <div className="text-[14px] text-gray-400">
                  {currentChat.online ? "Đang hoạt động" : 'Ẩn'}
                  {currentChat.nickname && ` • ${currentChat.nickname}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-7">
              <button><svg className="w-5 h-5 text-[#bb32eb]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M15 12a3 3 0 01-6 0 3 3 0 016 0z" /></svg></button>
              <button><svg className="w-6 h-6 text-[#bb32eb]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" /></svg></button>
              <button><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg></button>
            </div>
          </div>
          {/* Message Area */}
          <div
            className="overflow-y-auto px-7 py-6 flex flex-col-reverse scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-[#393A3B]"
            style={{ height: '600px', minHeight: '600px', maxHeight: '600px' }}
            ref={chatContainerRef}
          >
            <div className="flex flex-col gap-8">
              {currentChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[70%] ${message.sender === 'me' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-[#393A3B] text-gray-800 dark:text-gray-200'} rounded-2xl px-4 py-2 relative group`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedMessage(index);
                    }}
                  >
                    {message.replyTo != null && (
                      <div className="text-xs opacity-70 border-l-2 border-gray-400 pl-2 mb-1">
                        Trả lời {currentChat.messages[message.replyTo].sender === 'me' ? 'bạn' : currentChat.name}: {currentChat.messages[message.replyTo].text}
                      </div>
                    )}
                    {message.forwardedFrom && (
                      <div className="text-xs opacity-70 mb-1">
                        Đã chuyển tiếp từ {message.forwardedFrom}
                      </div>
                    )}
                    {message.type === 'text' && <p className="text-[15px] break-words">{message.text}</p>}
                    {message.type === 'image' && (
                      <img src={message.image} alt="Sent" className="max-w-full rounded-lg" />
                    )}
                    {message.type === 'gif' && (
                      <img src={message.gif} alt="GIF" className="max-w-full rounded-lg" />
                    )}
                    {message.type === 'voice' && (
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        </button>
                        <div className="flex-1 bg-white dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="w-1/2 h-full bg-blue-500"></div>
                        </div>
                        <span className="text-xs">{message.voice?.duration}s</span>
                      </div>
                    )}
                    {message.type === 'file' && (
                      <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1">
                          <div className="font-medium truncate">{message.file?.name}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(message.file?.size || 0)}</div>
                        </div>
                        <a href={message.file?.url} download className="text-blue-500">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    )}
                    {message.type === 'location' && (
                      <div className="p-2 bg-white dark:bg-gray-700 rounded">
                        <div className="h-32 bg-gray-100 dark:bg-gray-600 rounded mb-2">
                          {/* Map preview would go here */}
                        </div>
                        <div className="font-medium">{message.location?.name}</div>
                        <a 
                          href={`https://www.google.com/maps?q=${message.location?.lat},${message.location?.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Xem trên Google Maps
                        </a>
                      </div>
                    )}
                    {message.type === 'sticker' && (
                      <div className="text-4xl">{message.sticker}</div>
                    )}
                    {message.type === 'poll' && (
                      <div className="p-2 bg-white dark:bg-gray-700 rounded">
                        <div className="font-medium mb-2">{message.poll?.question}</div>
                        <div className="space-y-2">
                          {message.poll?.options.map((option, i) => (
                            <div key={i} className="relative">
                              <div className="h-8 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500"
                                  style={{ width: `${(option.votes / (message.poll?.totalVotes || 1)) * 100}%` }}
                                ></div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-between px-2 text-sm">
                                <span>{option.text}</span>
                                <span>{option.votes} votes</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {message.poll?.totalVotes} votes total
                        </div>
                      </div>
                    )}
                    {message.type === 'contact' && (
                      <div className="p-2 bg-white dark:bg-gray-700 rounded">
                        <div className="font-medium">{message.contact?.name}</div>
                        <div className="text-sm text-gray-500">{message.contact?.phone}</div>
                        {message.contact?.email && (
                          <div className="text-sm text-gray-500">{message.contact.email}</div>
                        )}
                      </div>
                    )}
                    {message.type === 'code' && (
                      <div className="p-2 bg-gray-800 rounded">
                        <div className="text-xs text-gray-400 mb-1">{message.code?.language}</div>
                        <pre className="text-sm text-gray-200 whitespace-pre-wrap">{message.code?.content}</pre>
                      </div>
                    )}
                    {message.type === 'video' && (
                      <div className="relative">
                        <img src={message.video?.thumbnail} alt="Video thumbnail" className="max-w-full rounded-lg" />
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(message.video?.duration || 0)}
                        </div>
                        <button className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {message.type === 'document' && (
                      <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1">
                          <div className="font-medium truncate">{message.document?.name}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(message.document?.size || 0)}</div>
                        </div>
                        <a href={message.document?.url} download className="text-blue-500">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    )}
                    {message.type === 'calendar' && (
                      <div className="p-2 bg-white dark:bg-gray-700 rounded">
                        <div className="font-medium mb-2">{message.calendar?.title}</div>
                        <div className="text-sm text-gray-500">
                          {formatDateTime(message.calendar?.startTime || '')} - {formatDateTime(message.calendar?.endTime || '')}
                        </div>
                        {message.calendar?.location && (
                          <div className="text-sm text-gray-500 mt-1">
                            <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {message.calendar.location}
                          </div>
                        )}
                        {message.calendar?.description && (
                          <div className="text-sm mt-2">{message.calendar.description}</div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {message.reactions && Object.entries(message.reactions).map(([reaction, users]) => (
                        <span key={reaction} className="text-xs bg-gray-200 dark:bg-[#292B2C] px-1 rounded">
                          {reaction} {users.length}
                        </span>
                      ))}
                      <span className="text-[11px] opacity-70">{message.time}</span>
                      {message.sender === 'me' && (
                        <span className="text-[11px] opacity-70">
                          {messageStatus[index]?.read ? '✓✓' : messageStatus[index]?.delivered ? '✓' : ''}
                        </span>
                      )}
                    </div>
                    {selectedMessage === index && (
                      <div className="absolute right-0 top-0 bg-white dark:bg-[#242526] shadow-lg rounded-lg py-1 w-48">
                        <button 
                          className="w-full text-left px-3 py-1 hover:bg-gray-100 dark:hover:bg-[#393A3B]"
                          onClick={() => handleReaction(index, '👍')}
                        >
                          Thêm phản ứng
                        </button>
                        <button 
                          className="w-full text-left px-3 py-1 hover:bg-gray-100 dark:hover:bg-[#393A3B]"
                          onClick={() => handleReply(index)}
                        >
                          Trả lời
                        </button>
                        <button 
                          className="w-full text-left px-3 py-1 hover:bg-gray-100 dark:hover:bg-[#393A3B]"
                          onClick={() => handleForwardMessage(index)}
                        >
                          Chuyển tiếp
                        </button>
                        <button 
                          className="w-full text-left px-3 py-1 hover:bg-gray-100 dark:hover:bg-[#393A3B] text-red-500"
                          onClick={() => handleDeleteMessage(index)}
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-[#393A3B] rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Message Toolbar */}
          <div className="flex items-center px-7 py-3 border-t border-gray-200 dark:border-[#393A3B] gap-2 relative">
            {/* Nút emoji */}
            <button className="w-8 h-8 flex items-center justify-center relative" tabIndex={-1} onClick={()=>setShowEmoji(!showEmoji)}>
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" /><circle cx="8" cy="10" r="1" /><circle cx="16" cy="10" r="1" /><path d="M8 16c1.333-1 2.667-1 4 0" strokeWidth="1.5"/></svg>
              {showEmoji && (
                <div className="absolute z-20 bottom-10 left-0 bg-white dark:bg-[#282a2c] rounded shadow-lg border p-2 flex flex-wrap w-64">
                  {allEmojis.map((em) => (<button key={em} className="text-2xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={()=>handleEmoji(em)}>{em}</button>))}
                </div>)
              }
            </button>
            {/* Nút ghi âm */}
            <button 
              className={`w-8 h-8 flex items-center justify-center ${isRecordingVoice ? 'text-red-500' : 'text-gray-500'}`}
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onTouchStart={startVoiceRecording}
              onTouchEnd={stopVoiceRecording}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            {/* Nút gọi video */}
            <button 
              className="w-8 h-8 flex items-center justify-center text-gray-500"
              onClick={() => startCall('video')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {/* Nút gọi thoại */}
            <button 
              className="w-8 h-8 flex items-center justify-center text-gray-500"
              onClick={() => startCall('audio')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            {/* Nút + (kẹp giấy) */}
            <div className="relative">
              <button className="w-8 h-8 flex items-center justify-center text-gray-500" onClick={()=>setShowAttachmentMenu(v=>!v)}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
              {showAttachmentMenu && (
                <div className="absolute z-30 bottom-12 left-0 bg-white dark:bg-[#282a2c] rounded shadow-lg border p-2 w-56 flex flex-col gap-2">
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2" onClick={()=>{fileInputRef.current?.click(); setShowAttachmentMenu(false);}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> Ảnh/File</button>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2" onClick={()=>{setShowGif(true); setShowAttachmentMenu(false);}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="3"/></svg> GIF</button>
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2" onClick={()=>{setShowStickerPicker(true); setShowAttachmentMenu(false);}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg> Sticker</button>
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2" onClick={()=>{setShowLocationPicker(true); setShowAttachmentMenu(false);}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg> Vị trí</button>
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2" onClick={()=>{setShowPollCreator(true); setShowAttachmentMenu(false);}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="7" width="18" height="10" rx="2"/></svg> Khảo sát</button>
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2" onClick={()=>{setShowContactPicker(true); setShowAttachmentMenu(false);}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg> Liên hệ</button>
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2" onClick={()=>{setShowCodeEditor(true); setShowAttachmentMenu(false);}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> Code</button>
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2" onClick={()=>{setShowVideoRecorder(true); setShowAttachmentMenu(false);}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="7" width="18" height="10" rx="2"/></svg> Video</button>
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2" onClick={()=>{setShowCalendarCreator(true); setShowAttachmentMenu(false);}}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> Sự kiện</button>
                </div>
              )}
            </div>
            {/* Input */}
            <div className="flex-1 relative mx-2">
              <input
                className="w-full border border-gray-100 dark:border-[#393A3B] bg-gray-100 dark:bg-[#292B2C] rounded-full pl-5 pr-14 py-3 text-[16px] placeholder:text-gray-500 outline-none text-black dark:text-white"
                placeholder="Aa"
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { handleSend(); e.preventDefault(); }}}
              />
              {imagePreview && (
                <div className="absolute left-2 -top-[120px] w-28 h-20 flex flex-col bg-white dark:bg-[#282a2c] border shadow rounded z-20"><img src={imagePreview} className="flex-1 object-contain" alt="preview"/><button className="text-xs text-blue-600 hover:underline" onClick={handleSendImage}>Gửi ảnh</button></div>)
              }
            </div>
            {/* Nút gửi */}
            <button
              disabled={(!input.trim() && !imagePreview)}
              className="w-8 h-8 flex items-center justify-center disabled:opacity-60"
              onClick={()=>imagePreview ? handleSendImage() : handleSend()}
            ><svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 8v4l3 3" /></svg></button>
          </div>

          {/* Call UI */}
          {showCallControls && currentCall && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#242526] rounded-lg p-4 w-[800px] h-[600px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {currentCall.type === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại'} với {currentChat.name}
                  </h2>
                  <button onClick={endCall} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>
                
                <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden">
                  {currentCall.type === 'video' && (
                    <>
                      <video 
                        ref={video => {
                          if (video && localStream) {
                            video.srcObject = localStream;
                          }
                        }}
                        autoPlay
                        muted
                        className="absolute top-4 right-4 w-48 h-36 rounded-lg object-cover"
                      />
                      <video 
                        ref={video => {
                          if (video && remoteStream) {
                            video.srcObject = remoteStream;
                          }
                        }}
                        autoPlay
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </>
                  )}
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <button 
                      onClick={toggleMute}
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isMuted ? 'bg-red-500' : 'bg-gray-700'
                      }`}
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                    
                    {currentCall.type === 'video' && (
                      <button 
                        onClick={toggleVideo}
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isVideoOff ? 'bg-red-500' : 'bg-gray-700'
                        }`}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    
                    <button 
                      onClick={endCall}
                      className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    </button>
                    
                    {currentCall.type === 'video' && (
                      <button 
                        onClick={toggleScreenShare}
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isScreenSharing ? 'bg-blue-500' : 'bg-gray-700'
                        }`}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setShowCallSettings(true)}
                      className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Incoming Call UI */}
          {showIncomingCall && incomingCall && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#242526] rounded-lg p-6 w-[400px] text-center">
                <h2 className="text-2xl font-semibold mb-2">
                  {incomingCall.type === 'video' ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {currentChat.name} đang gọi cho bạn
                </p>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={acceptCall}
                    className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button 
                    onClick={rejectCall}
                    className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Call Settings Modal */}
          {showCallSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#242526] rounded-lg p-4 w-[400px]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Cài đặt cuộc gọi</h2>
                  <button onClick={() => setShowCallSettings(false)}>✕</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Chất lượng cuộc gọi</label>
                    <select
                      value={callQuality}
                      onChange={(e) => updateCallQuality(e.target.value as 'auto' | 'low' | 'medium' | 'high')}
                      className="w-full p-2 border rounded"
                    >
                      <option value="auto">Tự động</option>
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tắt tiếng</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMuted}
                        onChange={toggleMute}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {currentCall?.type === 'video' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tắt camera</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isVideoOff}
                            onChange={toggleVideo}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Chia sẻ màn hình</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isScreenSharing}
                            onChange={toggleScreenShare}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Call History Modal */}
          {showCallHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#242526] rounded-lg p-4 w-[600px] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Lịch sử cuộc gọi</h2>
                  <button onClick={() => setShowCallHistory(false)}>✕</button>
                </div>
                <div className="space-y-2">
                  {callHistory.map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          call.type === 'video' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {call.type === 'video' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            )}
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">{call.participants[0]}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(call.startTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {call.duration > 0 ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : 'Cuộc gọi nhỡ'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search Results Modal */}
          {showSearchResults && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#242526] rounded-lg p-4 w-[500px] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Kết quả tìm kiếm</h2>
                  <button 
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((result, index) => {
                      const chat = chats.find(c => c.id === result.chatId);
                      const message = chat?.messages[result.messageIndex];
                      return (
                        <div 
                          key={index}
                          className="p-3 hover:bg-gray-100 dark:hover:bg-[#393A3B] rounded-lg cursor-pointer"
                          onClick={() => {
                            handleSelectChat(result.chatId);
                            setShowSearchResults(false);
                            setSearchQuery("");
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <img src={chat?.avatar} alt={chat?.name} className="w-8 h-8 rounded-full" />
                            <span className="font-semibold">{chat?.name}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {message?.text}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {message?.time}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Không tìm thấy kết quả nào
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Customization Modal */}
          {showCustomizeChat && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#242526] rounded-lg p-4 w-[500px]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Tùy chỉnh đoạn chat</h2>
                  <button 
                    onClick={() => setShowCustomizeChat(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Màu sắc chủ đề</label>
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-full h-10 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Biệt danh</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Nhập biệt danh"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Emoji</label>
                    <div className="flex flex-wrap gap-2">
                      {allEmojis.map((em) => (
                        <button
                          key={em}
                          onClick={() => setEmoji(em)}
                          className={`text-2xl p-2 rounded ${emoji === em ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowCustomizeChat(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleCustomizeChat}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Media, Files and Links Modal */}
          {showMediaFiles && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#242526] rounded-lg p-4 w-[800px] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">File phương tiện, file và liên kết</h2>
                  <button 
                    onClick={() => setShowMediaFiles(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {getMediaFiles().map((item, index) => (
                    <div key={index} className="relative group">
                      {item.type === 'image' && (
                        <img 
                          src={item.content} 
                          alt="Media" 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      )}
                      {item.type === 'gif' && (
                        <img 
                          src={item.content} 
                          alt="GIF" 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      )}
                      {item.type === 'link' && (
                        <a 
                          href={item.content} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block p-4 bg-gray-100 dark:bg-[#393A3B] rounded-lg hover:bg-gray-200 dark:hover:bg-[#4a4b50]"
                        >
                          <div className="text-sm truncate">{item.content}</div>
                        </a>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy and Support Modal */}
          {showPrivacySupport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#242526] rounded-lg p-4 w-[500px]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Quyền riêng tư và hỗ trợ</h2>
                  <button 
                    onClick={() => setShowPrivacySupport(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Tắt thông báo</div>
                      <div className="text-sm text-gray-500">Tắt thông báo từ {currentChat.name}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={muteNotifications}
                        onChange={(e) => setMuteNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Chặn người dùng</div>
                      <div className="text-sm text-gray-500">Chặn {currentChat.name} và xóa đoạn chat</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={blockUser}
                        onChange={(e) => setBlockUser(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Báo cáo người dùng</div>
                      <div className="text-sm text-gray-500">Báo cáo {currentChat.name} vì vi phạm</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportUser}
                        onChange={(e) => setReportUser(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-2">Hỗ trợ</div>
                    <div className="space-y-2">
                      <a href="#" className="block text-blue-500 hover:underline">Trung tâm trợ giúp</a>
                      <a href="#" className="block text-blue-500 hover:underline">Báo cáo sự cố</a>
                      <a href="#" className="block text-blue-500 hover:underline">Điều khoản và chính sách</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Chat Info (Right Panel) */}
        <aside className="w-[325px] bg-white dark:bg-[#242526] rounded-lg ml-2 shadow flex flex-col h-full px-6 pt-8 pb-4">
          <div className="flex flex-col items-center">
            <img src={currentChat.avatar} className="w-20 h-20 mb-2 rounded-full" alt="avatar" />
            <span className="font-medium text-lg">{currentChat.name}</span>
            <span className="text-gray-400 -mt-1 text-sm mb-6">{currentChat.online ? 'Đang hoạt động' : 'Offline'}</span>
            <div className="flex gap-6 mb-6">
              <button className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                <span className="text-xs">Trang cá n...</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                <span className="text-xs">Tắt thông báo</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                <span className="text-xs">Tìm kiếm</span>
              </button>
            </div>
          </div>
          <nav className="flex flex-col gap-1 mt-4 text-[15px]">
            <div 
              className="flex justify-between items-center px-2 py-3 hover:bg-gray-100 dark:hover:bg-[#393A3B] rounded cursor-pointer"
              onClick={() => setShowCustomizeChat(true)}
            >
              Tùy chỉnh đoạn chat <span className="text-xl">›</span>
            </div>
            <div 
              className="flex justify-between items-center px-2 py-3 hover:bg-gray-100 dark:hover:bg-[#393A3B] rounded cursor-pointer"
              onClick={() => setShowMediaFiles(true)}
            >
              File phương tiện, file và liên kết <span className="text-xl">›</span>
            </div>
            <div 
              className="flex justify-between items-center px-2 py-3 hover:bg-gray-100 dark:hover:bg-[#393A3B] rounded cursor-pointer"
              onClick={() => setShowPrivacySupport(true)}
            >
              Quyền riêng tư và hỗ trợ <span className="text-xl">›</span>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
}

export default MessengerUI;
