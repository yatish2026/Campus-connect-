import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Search, Send, Paperclip, Smile, Copy, Trash2, CornerUpLeft } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { initSocket, getSocket } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';

// lightweight emoji palette (can be replaced by a picker lib)
const EMOJIS = ['😀', '😄', '😊', '😉', '😍', '😅', '🤔', '👍', '🎉', '🔥'];

export default function ChatLayout() {
  const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  const [conversations, setConversations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState('');
  const [onlineMap, setOnlineMap] = useState({});
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const INJECTED_KEY = 'app_injected_conversations_v1';

  const loadInjectedFromStorage = () => {
    try {
      const raw = localStorage.getItem(INJECTED_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      return [];
    }
  };

  const saveInjectedToStorage = (arr) => {
    try {
      const onlyInjected = (arr || []).filter(a => a && a.isInjected).map(a => ({ ...a }));
      localStorage.setItem(INJECTED_KEY, JSON.stringify(onlyInjected));
    } catch (e) {
      // ignore
    }
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/messages/conversations');
      // normalize: expect array of { partnerId, lastMessage, ... }
      const convs = res.data || [];
      // ensure connections are first (we'll keep ordering from backend) and limit to top 10
      const topAgg = convs.slice(0, 10);

      // Enrich each aggregated conversation with partnerName and profilePicture
      const enriched = await Promise.all(topAgg.map(async (a) => {
        // aggregated _id is the partner ObjectId
        const partnerId = (a._id && (a._id._id || a._id)) || a._id;
        let partnerName = 'Unknown';
        let profilePicture = '/avatar.png';
        try {
          const u = await axiosInstance.get(`/users/id/${partnerId}`);
          if (u && u.data) {
            partnerName = u.data.username || u.data.name || (u.data._id || 'Unknown');
            profilePicture = u.data.profilePicture || u.data.avatar || profilePicture;
          }
        } catch (e) {
          // leave defaults
        }
        return {
          _id: partnerId,
          partnerId,
          partnerName,
          profilePicture,
          lastMessage: a.lastMessage || a.lastMessage || { text: '', createdAt: Date.now() },
        };
      }));

      setConversations((prev) => {
        // preserve any client-injected conversations (e.g., opened via ?open=<id>)
        // keep enriched server connections first, then any injected items not already present.
        const topIds = new Set(enriched.map((c) => (c._id || c.partnerId || c.id)));
        const injected = prev.filter((p) => p.isInjected && !topIds.has(p._id || p.partnerId || p.id));
        return [...enriched, ...injected];
      });
      if (!activeId && enriched.length) setActiveId(enriched[0]._id || enriched[0].partnerId || enriched[0].id);
    } catch (err) {
      console.error('fetchConversations', err);
    }
  }, [activeId]);

  const queryClient = useQueryClient();
  const [unreadMap, setUnreadMap] = useState({}); // { partnerId: count }

  const updateTotalUnreadCache = (map) => {
    const total = Object.values(map || {}).reduce((s, v) => s + (v || 0), 0);
    queryClient.setQueryData(['unreadMessagesCount'], total);
  };

  const fetchMessages = useCallback(async (conversationPartnerId) => {
    if (!conversationPartnerId) return;
    try {
      const res = await axiosInstance.get(`/messages/conversation/${conversationPartnerId}`);
      const raw = res.data || [];

      // Determine partner name (from conversations cache or by fetching once)
      let partnerName = conversations.find(c => (c._id || c.partnerId || c.id) === conversationPartnerId)?.partnerName;
      if (!partnerName) {
        try {
          const p = await axiosInstance.get(`/users/id/${conversationPartnerId}`);
          partnerName = p.data?.username || p.data?.name || p.data?._id || 'Unknown';
        } catch (e) {
          partnerName = 'Unknown';
        }
      }

      // Map messages to include senderName and fromMe
      const mapped = raw.map((m) => {
        const sid = m.senderId ? (typeof m.senderId === 'string' ? m.senderId : m.senderId._id || m.senderId) : (m.from || m.sender);
        const fromMe = authUser && sid && (String(sid) === String(authUser._id));
        const senderName = fromMe ? (authUser?.username || authUser?.name || 'You') : partnerName;
        return {
          id: m._id || m.id || Date.now().toString(),
          fromMe,
          text: m.text,
          time: m.createdAt || m.updatedAt || m.time || Date.now(),
          senderName,
          senderAvatar: fromMe ? (authUser?.profilePicture || '/avatar.png') : (conversations.find(c => (c._id || c.partnerId || c.id) === conversationPartnerId)?.profilePicture || '/avatar.png'),
          fileUrl: m.fileUrl,
          fileName: m.fileName,
        };
      });

      setMessages(mapped);
    } catch (err) {
      console.error('fetchMessages', err);
    }
  }, []);

  useEffect(() => {
    // load injected conversations from localStorage first
    const stored = loadInjectedFromStorage();
    if (stored.length) setConversations((prev) => {
      // avoid duplicates with prev
      const existing = new Set(prev.map(c => (c._id || c.partnerId || c.id)));
      const filtered = stored.filter(s => !existing.has(s._id || s.partnerId || s.id));
      return [...filtered, ...prev];
    });
    fetchConversations();
    // init socket with token
    const token = localStorage.getItem('token');
    const s = initSocket(token);
    socketRef.current = s;

    s.on('connect', () => {
      console.log('socket connected');
    });

    s.on('userOnline', (userId) => {
      setOnlineMap((m) => ({ ...m, [userId]: true }));
    });
    s.on('userOffline', (userId) => {
      setOnlineMap((m) => ({ ...m, [userId]: false }));
    });

    s.on('receiveMessage', (msg) => {
      // msg shape expected: { from / senderId, to / receiverId, text, createdAt }
      try {
        const sid = msg.senderId || msg.from || msg.sender;
        const fromMe = authUser && sid && (String(sid) === String(authUser._id));
        // try to resolve senderName: if fromMe -> authUser, else find partnerName
        const partnerName = conversations.find(c => (c._id || c.partnerId || c.id) === (fromMe ? (msg.receiverId || msg.to) : sid))?.partnerName;
        const senderName = fromMe ? (authUser?.username || authUser?.name || 'You') : (partnerName || msg.senderName || 'Unknown');
        const partnerId = fromMe ? (msg.receiverId || msg.to) : sid;
        const newMsg = { id: msg._id || msg.id || Date.now().toString(), fromMe, text: msg.text, time: msg.createdAt || msg.time || 'Now', senderName, senderAvatar: fromMe ? (authUser?.profilePicture || '/avatar.png') : (conversations.find(c => (c._id || c.partnerId || c.id) === sid)?.profilePicture || '/avatar.png') };
        setMessages((m) => [...m, newMsg]);

        // move partner conversation to top of list
        setConversations((prev) => {
          const pid = partnerId;
          const existing = prev.find(p => (p._id || p.partnerId || p.id) === pid);
          const others = prev.filter(p => (p._id || p.partnerId || p.id) !== pid);
          if (existing) return [existing, ...others];
          // if no existing, optionally inject a minimal conv
          const injected = { _id: pid, partnerId: pid, partnerName: senderName, profilePicture: newMsg.senderAvatar || '/avatar.png', lastMessage: { text: msg.text, createdAt: Date.now() }, isInjected: true };
          const next = [injected, ...prev];
          saveInjectedToStorage(next);
          return next;
        });

        // bump unread count if not the active chat
        if (String(partnerId) !== String(activeId)) {
          setUnreadMap((u) => {
            const next = { ...(u || {}), [partnerId]: ((u && u[partnerId]) || 0) + 1 };
            updateTotalUnreadCache(next);
            return next;
          });
        }
      } catch (e) {
        setMessages((m) => [...m, { id: msg._id || Date.now().toString(), fromMe: false, text: msg.text, time: msg.createdAt || 'Now', senderName: 'Unknown' }]);
      }
    });

    s.on('typing', ({ from, isTyping }) => {
      // if typing from active chat partner
      if (from && from === activeId) setTyping(isTyping);
    });

    s.on('messageRead', ({ messageId, reader }) => {
      // when someone reads messages we can decrement unread counts for their conversations
      // attempt to map reader (the user who read) to a conversation id
      const cid = String(reader);
      setUnreadMap((u) => {
        const cur = (u && u[cid]) || 0;
        if (cur <= 1) {
          const next = { ...(u || {}) };
          delete next[cid];
          updateTotalUnreadCache(next);
          return next;
        }
        const next = { ...(u || {}), [cid]: cur - 1 };
        updateTotalUnreadCache(next);
        return next;
      });
    });

    return () => {
      s.disconnect();
    };
  }, [fetchConversations, activeId]);

  useEffect(() => {
    // when activeId changes, fetch messages
    if (!activeId) return;
    fetchMessages(activeId);
  }, [activeId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const filteredConversations = conversations.filter(c => (c.name || c.partnerName || '').toLowerCase().includes(search.toLowerCase()) || (c.lastMessage?.text || '').toLowerCase().includes(search.toLowerCase()));
  const filteredSuggestions = suggestions.filter(s => (s.partnerName || s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.lastMessage?.text || '').toLowerCase().includes(search.toLowerCase()));

  const findPartner = (id) => {
    return conversations.find(c => (c._id || c.partnerId || c.id) === id) || suggestions.find(s => (s._id || s.partnerId || s.id) === id) || null;
  };

  const handleSuggestionClick = (sugg) => {
    const id = sugg._id || sugg.partnerId || sugg.id;
    // inject into conversations if not present and activate
    setConversations((prev) => {
      const existingIds = new Set(prev.map(c => (c._id || c.partnerId || c.id)));
      if (existingIds.has(id)) return prev;
      // mark as injected so it will be preserved across refreshes
      const injected = { ...sugg, isInjected: true, isSuggestion: false };
      const next = [injected, ...prev];
      saveInjectedToStorage(next);
      return next;
    });
    openConversation(id);
  };

  // wrap setActiveId to reset unread for that conversation
  const openConversation = (id) => {
    // activate the conversation and clear unread count for it
    setActiveId(id);
    // mark messages as read on server for this conversation
    (async () => {
      try {
        // fetch messages of this conversation to find unread message ids
        const res = await axiosInstance.get(`/messages/conversation/${id}`);
        const msgs = res.data || [];
        const unreadIds = msgs.filter(m => !m.isRead && String(m.receiverId) === String(authUser?._id)).map(m => m._id || m.id);
        if (unreadIds.length) {
          await axiosInstance.post('/messages/mark-read', { messageIds: unreadIds });
          // notify senders via socket
          getSocket()?.emit('markAsRead', { messageIds: unreadIds });
        }
      } catch (e) {
        // ignore
      }
    })();

    setUnreadMap((u) => {
      const next = { ...(u || {}) };
      delete next[id];
      updateTotalUnreadCache(next);
      return next;
    });
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const payload = { receiverId: activeId, text: trimmed }; // Updated to use receiverId
      const res = await axiosInstance.post('/messages', payload);
      const newMsg = { id: res.data._id || Date.now().toString(), fromMe: true, text: trimmed, time: res.data.createdAt || 'Now' };
      setMessages((m) => [...m, newMsg]);
      setText('');
      // move this conversation to top
      setConversations((prev) => {
        const pid = activeId;
        const existing = prev.find(p => (p._id || p.partnerId || p.id) === pid);
        const others = prev.filter(p => (p._id || p.partnerId || p.id) !== pid);
        if (existing) return [existing, ...others];
        // not found, create light injected
        const injected = { _id: pid, partnerId: pid, partnerName: (findPartner(pid)?.partnerName) || 'Unknown', profilePicture: findPartner(pid)?.profilePicture || '/avatar.png', lastMessage: { text: trimmed, createdAt: Date.now() }, isInjected: true };
        const next = [injected, ...prev];
        saveInjectedToStorage(next);
        return next;
      });
      // reset unread for this conversation
      setUnreadMap((u) => {
        const next = { ...(u || {}) };
        delete next[activeId];
        updateTotalUnreadCache(next);
        return next;
      });
      // emit socket
      getSocket()?.emit('sendMessage', res.data);
    } catch (err) {
      console.error('sendMessage', err);
    }
  };

  const sendFile = async (file) => {
    if (!file || !activeId) return;
    const form = new FormData();
    form.append('file', file);
    form.append('to', activeId);
    setFileUploading(true);
    try {
      const res = await axiosInstance.post('/messages/file', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const payload = res.data; // expect { _id, fileUrl, fileName, createdAt }
      setMessages((m) => [...m, { id: payload._id || Date.now().toString(), fromMe: true, text: payload.fileName || 'file', fileUrl: payload.fileUrl, time: payload.createdAt || 'Now' }]);
      getSocket()?.emit('sendMessage', payload);
    } catch (err) {
      console.error('sendFile', err);
    } finally {
      setFileUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) sendFile(f);
    e.target.value = '';
  };

  const toggleEmoji = () => setEmojiOpen(v => !v);
  const pickEmoji = (emoji) => {
    // insert emoji at current caret position in the input
    try {
      const el = inputRef.current;
      if (el && typeof el.selectionStart === 'number') {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const before = text.slice(0, start);
        const after = text.slice(end);
        const next = before + emoji + after;
        setText(next);
        // set caret after inserted emoji on next tick
        requestAnimationFrame(() => {
          try { el.selectionStart = el.selectionEnd = start + emoji.length; el.focus(); } catch (e) { }
        });
        return;
      }
    } catch (e) {
      // fallback
    }
    setText(t => t + emoji);
  };

  const fetchSuggestions = async () => {
    try {
      const res = await axiosInstance.get('/users/suggestions');
      const suggestions = res.data || [];
      // normalize suggestions into conversation-like items so they show in the left list
      const convs = (Array.isArray(suggestions) ? suggestions : suggestions.users || []).map((u) => ({
        _id: u._id || u.id,
        partnerId: u._id || u.id,
        partnerName: u.username || u.name || u.displayName || 'Unknown',
        profilePicture: u.profilePicture || u.avatar || '/avatar.png',
        lastMessage: { text: u.headline || '', createdAt: Date.now() },
        online: false,
        isSuggestion: true,
      }));
      return convs;
    } catch (err) {
      console.error('fetchSuggestions', err);
      return [];
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchSuggestions().then((suggestionsConv) => {
      if (!mounted) return;
      // keep suggestions separate so we always render conversations first, then suggestions
      setSuggestions(suggestionsConv);
    });
    return () => { mounted = false; };
  }, []);

  // Accept optional ?open=<id> query param to open a specific chat (e.g., from Network page)
  const location = useLocation();
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const openId = qp.get('open');
    if (openId) {
      // if the id exists in conversations, activate it. Otherwise fetch profile and inject.
      const exists = conversations.some((c) => (c._id || c.partnerId || c.id) === openId);
      if (exists) {
        openConversation(openId);
      } else {
        (async () => {
          try {
            const res = await axiosInstance.get(`/users/id/${openId}`);
            const u = res.data;
            const conv = {
              _id: u._id || u.id,
              partnerId: u._id || u.id,
              partnerName: u.username || u.name || u.displayName || 'Unknown',
              profilePicture: u.profilePicture || u.avatar || '/avatar.png',
              lastMessage: { text: u.headline || '', createdAt: Date.now() },
              online: false,
              isInjected: true,
            };
            setConversations((prev) => {
              const existingIds = new Set(prev.map((c) => c._id || c.partnerId || c.id));
              if (existingIds.has(conv._id)) return prev;
              const next = [conv, ...prev];
              saveInjectedToStorage(next);
              return next;
            });
            openConversation(conv._id || conv.partnerId);
          } catch (err) {
            console.error('Failed to fetch user for open=', openId, err);
            openConversation(openId); // fallback to open id anyway
          }
        })();
      }
    }
  }, [location.search]);

  const handleCopy = async (text) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('copy failed', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/messages/${id}`);
      setMessages((m) => m.filter(x => x.id !== id));
    } catch (e) {
      console.error('delete message', e);
    }
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    const mention = msg.senderName ? `@${msg.senderName} ` : '';
    setText((t) => (mention + t));
    // focus input
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 to-white font-sans">
      {/* Left Sidebar */}
      <aside className="w-80 min-w-[280px] max-w-[320px] border-r bg-white p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input aria-label="Search conversations" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages" className="pl-9 pr-3 py-2 w-full rounded-2xl bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        </div>

        <div className="flex-1 overflow-auto space-y-2" role="list">
          {filteredConversations.map(conv => {
            const id = conv._id || conv.partnerId || conv.id;
            const name = conv.partnerName || conv.name || conv.username || conv.displayName || 'Unknown';
            const last = conv.lastMessage?.text || conv.last || '';
            const time = conv.lastMessage?.createdAt || conv.time || '';
            const online = onlineMap[id] ?? conv.online;
            const unreadCount = unreadMap[id] || 0;
            return (
              <button key={id} onClick={() => openConversation(id)} className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-blue-50 transition-colors cursor-pointer w-full text-left ${activeId === id ? 'bg-blue-50' : ''}`} role="listitem" aria-current={activeId === id}>
                <div className="relative flex-shrink-0">
                  <img src={conv.profilePicture || conv.avatar || '/avatar.png'} alt={name} className="w-12 h-12 rounded-full object-cover" />
                  <span className={`absolute right-0 bottom-0 w-3 h-3 rounded-full ring-2 ring-white ${online ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold truncate">{name}</h4>
                    {conv.isSuggestion && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Suggested</span>}
                    {unreadCount > 0 && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">{unreadCount}</span>}
                    <span className="text-xs text-gray-400 ml-2">{new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">{last}</p>
                </div>
              </button>
            );
          })}

          {filteredSuggestions.length > 0 && (
            <div className="pt-2">
              <div className="px-2 text-xs text-gray-500 font-semibold mb-2">Suggestions</div>
              <div className="space-y-2">
                {filteredSuggestions.map(sugg => {
                  const id = sugg._id || sugg.partnerId || sugg.id;
                  const name = sugg.partnerName || sugg.name || 'Unknown';
                  const last = sugg.lastMessage?.text || '';
                  const time = sugg.lastMessage?.createdAt || '';
                  const online = onlineMap[id] ?? sugg.online;
                  return (
                    <button key={id} onClick={() => handleSuggestionClick(sugg)} className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-yellow-50 transition-colors cursor-pointer w-full text-left ${activeId === id ? 'bg-yellow-50' : ''}`} role="listitem">
                      <div className="relative flex-shrink-0">
                        <img src={sugg.profilePicture || sugg.avatar || '/avatar.png'} alt={name} className="w-12 h-12 rounded-full object-cover" />
                        <span className={`absolute right-0 bottom-0 w-3 h-3 rounded-full ring-2 ring-white ${online ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-semibold truncate">{name}</h4>
                          <span className="text-xs text-gray-400 ml-2">{new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">{last}</p>
                      </div>
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Suggested</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Right Chat Window */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <img src={conversations.find(c => (c._id || c.partnerId || c.id) === activeId)?.profilePicture || '/avatar.png'} alt="avatar" className="w-12 h-12 rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{conversations.find(c => (c._id || c.partnerId || c.id) === activeId)?.partnerName || conversations.find(c => (c._id || c.partnerId || c.id) === activeId)?.name || conversations.find(c => (c._id || c.partnerId || c.id) === activeId)?.username || 'Select a chat'}</h3>
                <span className={`w-2 h-2 rounded-full ${onlineMap[activeId] ? 'bg-green-400' : 'bg-gray-300'}`}></span>
              </div>
              <div className="text-xs text-gray-400">Last seen {conversations.find(c => (c._id || c.partnerId || c.id) === activeId)?.lastSeen || 'a while ago'}</div>
            </div>
          </div>
        </header>

        {/* Messages area */}
        <section className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-3xl mx-auto space-y-4">
            <AnimatePresence initial={false} mode="popLayout">
              {messages.map((msg, idx) => {
                // determine if this message starts a new group (different sender or gap > 2 minutes)
                const prev = messages[idx - 1];
                const gap = prev ? (new Date(msg.time) - new Date(prev.time)) : Infinity;
                const isNewGroup = !prev || prev.fromMe !== msg.fromMe || gap > 2 * 60 * 1000; // 2 minutes
                return (
                  <div key={msg.id} className="group">
                    {isNewGroup && (
                      <div className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} mb-1 items-center`}>
                        {!msg.fromMe && (
                          <img src={msg.senderAvatar || '/avatar.png'} alt={msg.senderName} className="w-8 h-8 rounded-full mr-2" />
                        )}
                        <div className={`text-xs text-gray-500 ${msg.fromMe ? 'text-right' : 'text-left'} font-semibold flex items-center gap-2`}>
                          <span>{msg.fromMe ? (authUser?.username || authUser?.name || 'You') : (msg.senderName || 'Unknown')}</span>
                          <span className="text-[11px] text-gray-400">{new Date(msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {msg.fromMe && (
                          <img src={msg.senderAvatar || '/avatar.png'} alt={msg.senderName} className="w-8 h-8 rounded-full ml-2" />
                        )}
                      </div>
                    )}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`relative inline-block p-3 rounded-2xl shadow-sm ${msg.fromMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`} style={{ maxWidth: '70%' }}>
                        {/* action buttons (copy, reply, delete) - appear on hover */}
                        <div className="absolute -top-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-40">
                          <button title="Copy" onClick={() => handleCopy(msg.fileUrl || msg.text)} className="p-1 rounded bg-white/10 hover:bg-white/20 text-xs"><Copy size={14} /></button>
                          <button title="Reply" onClick={() => handleReply(msg)} className="p-1 rounded bg-white/10 hover:bg-white/20 text-xs"><CornerUpLeft size={14} /></button>
                          {msg.fromMe && <button title="Delete" onClick={() => handleDelete(msg.id)} className="p-1 rounded bg-red-500 hover:bg-red-600 text-white"><Trash2 size={14} /></button>}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {msg.fileUrl ? (
                            <>
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={`underline ${msg.fromMe ? 'text-white' : ''}`}>{msg.fileName || 'file'}</a>
                              {msg.text && msg.text !== msg.fileName ? <div className="text-xs text-gray-200 mt-1">{msg.text}</div> : null}
                            </>
                          ) : (
                            msg.text
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 text-right">{new Date(msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </AnimatePresence>

            {typing && (
              <div className="flex justify-start">
                <div className="inline-block p-2 rounded-2xl bg-white shadow-sm">
                  <div className="text-sm text-gray-500">Typing<span className="animate-pulse">...</span></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>
        </section>



        {/* Input area */}
        <footer className="p-4 border-t bg-white">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {/* Reply preview */}
            {replyTo && (
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-12 bg-white border rounded-lg px-3 py-2 shadow-md w-96 z-50 flex justify-between items-start">
                <div className="text-xs text-gray-600">
                  Replying to <span className="font-semibold">{replyTo.senderName || 'Unknown'}</span>
                  <div className="text-[12px] text-gray-500 truncate">{replyTo.text || replyTo.fileName || ''}</div>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-xs text-red-500">Cancel</button>
              </div>
            )}
            <div className="relative">
              <button aria-label="Emoji picker" onClick={toggleEmoji} className="p-2 rounded-full hover:bg-gray-100 transition"><Smile size={18} /></button>
              {emojiOpen && (
                <div className="absolute bottom-12 left-0 bg-white border rounded-lg p-2 shadow-md grid grid-cols-5 gap-2 z-50 w-48">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => { pickEmoji(e); setEmojiOpen(false); }} className="w-8 h-8 flex items-center justify-center text-lg p-1 hover:bg-gray-100 rounded">{e}</button>
                  ))}
                </div>
              )}
            </div>

            <label aria-label="Attach file" className="p-2 rounded-full hover:bg-gray-100 transition cursor-pointer">
              <input type="file" onChange={handleFileChange} className="hidden" />
              <Paperclip size={18} />
            </label>

            <input ref={inputRef} aria-label="Message input" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} placeholder="Write a message..." className="flex-1 px-4 py-2 rounded-2xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <button onClick={sendMessage} aria-label="Send message" className="ml-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-2xl transition flex items-center gap-2"><Send size={16} /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}
