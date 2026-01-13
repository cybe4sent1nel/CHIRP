import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios'

const initialState = {
    messages: [],
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
                            const timeClose = mTime && Math.abs(mTime - incomingTime) < 5000; // 5 seconds
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

            state.messages = [...state.messages, action.payload]
        },
        // Confirm optimistic message with server-provided message
        confirmMessage: (state, action) => {
            const { clientId, serverMessage } = action.payload;
            const idx = state.messages.findIndex(m => m._id === clientId);
            if (idx !== -1) {
                // Preserve optimistic flags (like outgoing) when replacing
                const existing = state.messages[idx] || {};
                state.messages[idx] = { ...serverMessage, outgoing: existing.outgoing || serverMessage.outgoing };
            } else {
                // Fallback: append server message
                state.messages.push(serverMessage);
            }
        },
        resetMessages: (state) => {
            state.messages = []
        },
        updateMessageStatus: (state, action) => {
            const { messageId, status } = action.payload;
            // Support matching by _id or id
            const messageIndex = state.messages.findIndex(msg => (msg._id && msg._id === messageId) || (msg.id && msg.id === messageId));
            
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