import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios'

const initialState = {
    messages: [],
    pendingStatuses: {}, // map messageId -> latest status received before message exists
    error: null,
    loading: false
}

export const fetchMessages = createAsyncThunk('messages/fetchMessages', async ({token, userId}, {rejectWithValue}) => {
    try {
        const {data} = await api.post('/api/message/get', {to_user_id: userId}, {
            headers: {Authorization: `Bearer ${token}`}
        })
        if (data.success) return data
        return rejectWithValue(data.message || 'Failed to fetch messages')
    } catch (error) {
        console.error('fetchMessages error:', error)
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch messages')
    }
})

const messageSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload
        },
        addMessage: (state, action) => {
            const incoming = action.payload;
            const incomingId = incoming?._id || incoming?.id || null;

            // If incoming has a server id, try to match existing optimistic message by heuristics
            if (incomingId) {
                // Exact id match
                const existsIndex = state.messages.findIndex(m => (m._id && m._id === incomingId) || (m.id && m.id === incomingId));
                if (existsIndex !== -1) {
                    state.messages[existsIndex] = { ...state.messages[existsIndex], ...incoming };
                    return;
                }

                // Heuristic: match by sender, text and createdAt proximity (within 5s)
                const incomingTime = incoming.createdAt ? new Date(incoming.createdAt).getTime() : null;
                if (incomingTime) {
                    const heuristicIndex = state.messages.findIndex(m => {
                        try {
                            const sameSender = (m.from_user_id && incoming.from_user_id && ((m.from_user_id._id && incoming.from_user_id._id && m.from_user_id._id === incoming.from_user_id._id) || (m.from_user_id === incoming.from_user_id)) ) || (m.sender_id && incoming.sender_id && m.sender_id === incoming.sender_id);
                            const sameText = (m.text && incoming.text && m.text === incoming.text) || false;
                            const mTime = m.createdAt ? new Date(m.createdAt).getTime() : null;
                            // broaden heuristic match window to 15 seconds to be more tolerant of clock skew/network delays
                            const timeClose = mTime && Math.abs(mTime - incomingTime) < 15000; // 15 seconds
                            return sameSender && sameText && timeClose;
                        } catch (e) {
                            return false;
                        }
                    });

                    if (heuristicIndex !== -1) {
                        state.messages[heuristicIndex] = { ...state.messages[heuristicIndex], ...incoming };
                        return;
                    }
                }
            }

            // If incoming has no server id, avoid duplicating exact same local message
            const duplicateIndex = state.messages.findIndex(m => {
                return (!incomingId) && m._id === incoming._id;
            });
            if (duplicateIndex !== -1) return;

            // Before appending, apply any pending status for this incoming id
            if (incomingId && state.pendingStatuses[incomingId]) {
                const status = state.pendingStatuses[incomingId];
                if (status === 'delivered') {
                    incoming.delivered = true;
                    incoming.delivered_at = incoming.delivered_at || new Date().toISOString();
                } else if (status === 'read') {
                    incoming.read = true;
                    incoming.read_at = incoming.read_at || new Date().toISOString();
                    incoming.delivered = true;
                    incoming.delivered_at = incoming.delivered_at || new Date().toISOString();
                }
                // clear pending status once applied
                delete state.pendingStatuses[incomingId];
            }

            state.messages = [...state.messages, action.payload]
        },
        // Confirm optimistic message with server-provided message
        confirmMessage: (state, action) => {
            const { clientId, serverMessage } = action.payload;
            const idx = state.messages.findIndex(m => m._id === clientId);
            if (idx !== -1) {
                // Preserve optimistic flags (like outgoing) when replacing
                const existing = state.messages[idx] || {};
                const merged = { ...serverMessage, outgoing: existing.outgoing || serverMessage.outgoing };
                // If there's a pending status for the server-provided id, apply it now
                const serverId = merged._id || merged.id;
                if (serverId && state.pendingStatuses[serverId]) {
                    const status = state.pendingStatuses[serverId];
                    if (status === 'delivered') {
                        merged.delivered = true;
                        merged.delivered_at = merged.delivered_at || new Date().toISOString();
                    } else if (status === 'read') {
                        merged.read = true;
                        merged.read_at = merged.read_at || new Date().toISOString();
                        merged.delivered = true;
                        merged.delivered_at = merged.delivered_at || new Date().toISOString();
                    }
                    delete state.pendingStatuses[serverId];
                }
                state.messages[idx] = merged;
            } else {
                // Fallback: append server message
                // apply pending status if exists
                const serverId = serverMessage._id || serverMessage.id;
                if (serverId && state.pendingStatuses[serverId]) {
                    const status = state.pendingStatuses[serverId];
                    if (status === 'delivered') {
                        serverMessage.delivered = true;
                        serverMessage.delivered_at = serverMessage.delivered_at || new Date().toISOString();
                    } else if (status === 'read') {
                        serverMessage.read = true;
                        serverMessage.read_at = serverMessage.read_at || new Date().toISOString();
                        serverMessage.delivered = true;
                        serverMessage.delivered_at = serverMessage.delivered_at || new Date().toISOString();
                    }
                    delete state.pendingStatuses[serverId];
                }
                state.messages.push(serverMessage);
            }
        },
        resetMessages: (state) => {
            state.messages = []
        },
        updateMessageStatus: (state, action) => {
            const { messageId, status } = action.payload;
            // Support matching by _id or id
                const normalize = (val) => {
                    if (!val) return null;
                    if (typeof val === 'string') return val;
                    if (typeof val === 'object') return val._id || val.id || null;
                    return null;
                };

                const messageIndex = state.messages.findIndex(msg => {
                    const mid = normalize(msg._id) || normalize(msg.id);
                    return mid && mid === normalize(messageId);
                });

                // If we couldn't find a message by id, try a heuristic: match by text + timestamp proximity + sender/recipient
                let usedHeuristic = false;
                if (messageIndex === -1) {
                    const targetId = normalize(messageId);
                    const incomingTime = null; // unknown here
                    const heuristicIndex = state.messages.findIndex(m => {
                        try {
                            const mTime = m.createdAt ? new Date(m.createdAt).getTime() : null;
                            const sameText = action.payload.text && m.text && action.payload.text === m.text;
                            // broaden heuristic window to 15s to tolerate clock skew/network delays
                            const timeClose = mTime && action.payload.createdAt ? Math.abs(mTime - new Date(action.payload.createdAt).getTime()) < 15000 : false; // 15s
                            const sameSender = (normalize(m.from_user_id) && normalize(action.payload.from_user_id) && normalize(m.from_user_id) === normalize(action.payload.from_user_id)) || false;
                            const sameRecipient = (normalize(m.to_user_id) && normalize(action.payload.to_user_id) && normalize(m.to_user_id) === normalize(action.payload.to_user_id)) || false;
                            return (sameText && (timeClose || sameSender || sameRecipient));
                        } catch (e) {
                            return false;
                        }
                    });

                    if (heuristicIndex !== -1) {
                        usedHeuristic = true;
                    }

                    if (heuristicIndex !== -1) {
                        // use heuristic index
                        const idx = heuristicIndex;
                        const updatedMessage = { ...state.messages[idx] };
                        if (status === 'delivered') {
                            updatedMessage.delivered = true;
                            updatedMessage.delivered_at = new Date().toISOString();
                        } else if (status === 'read') {
                            updatedMessage.read = true;
                            updatedMessage.read_at = new Date().toISOString();
                            updatedMessage.delivered = true;
                            if (!updatedMessage.delivered_at) updatedMessage.delivered_at = new Date().toISOString();
                        }
                        state.messages[idx] = updatedMessage;
                        console.log('Heuristic-updated message status:', state.messages[idx]._id || state.messages[idx].id, status);
                        return;
                    }
                    // If still not found, store as pending status to apply when message arrives/confirmed
                    if (targetId) {
                        state.pendingStatuses[targetId] = status;
                        console.log('Stored pending status for messageId', targetId, 'status', status);
                        return;
                    }
                }

                if (messageIndex !== -1) {
                // Create a new message object to ensure React detects the change
                const updatedMessage = { ...state.messages[messageIndex] };
                
                if (status === 'delivered') {
                    updatedMessage.delivered = true;
                    updatedMessage.delivered_at = new Date().toISOString();
                } else if (status === 'read') {
                    updatedMessage.read = true;
                    updatedMessage.read_at = new Date().toISOString();
                    // When read, also mark as delivered
                    updatedMessage.delivered = true;
                    if (!updatedMessage.delivered_at) {
                        updatedMessage.delivered_at = new Date().toISOString();
                    }
                }
                
                // Replace the message with the updated one
                state.messages[messageIndex] = updatedMessage;
                
                console.log('Updated message status:', messageId, status, updatedMessage);
            }
        },
        
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMessages.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.loading = false
                if(action.payload){
                    state.messages = action.payload.messages
                }
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload || 'Failed to fetch messages'
            })
    }
})

export const {setMessages, addMessage, confirmMessage, resetMessages, updateMessageStatus} = messageSlice.actions

export default messageSlice.reducer