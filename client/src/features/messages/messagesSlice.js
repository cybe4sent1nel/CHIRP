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
            state.messages = [...state.messages, action.payload]
        },
        resetMessages: (state) => {
            state.messages = []
        },
        updateMessageStatus: (state, action) => {
            const { messageId, status } = action.payload;
            const messageIndex = state.messages.findIndex(msg => msg._id === messageId);
            
            if (messageIndex !== -1) {
                const message = state.messages[messageIndex];
                
                if (status === 'delivered') {
                    message.delivered = true;
                    message.delivered_at = new Date().toISOString();
                } else if (status === 'read') {
                    message.read = true;
                    message.read_at = new Date().toISOString();
                    // When read, also mark as delivered
                    message.delivered = true;
                    if (!message.delivered_at) {
                        message.delivered_at = new Date().toISOString();
                    }
                }
                
                console.log('Updated message status:', messageId, status, message);
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

export const {setMessages, addMessage, resetMessages, updateMessageStatus} = messageSlice.actions

export default messageSlice.reducer