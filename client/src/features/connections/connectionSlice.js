import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios'

const initialState = {
    connections: [],
    pendingConnections: [],
    followers: [],
    following: [],
    onlineUsers: [] // Track online user IDs
}

export const fetchConnections = createAsyncThunk('connections/fetchConnections',
    async (token) => {
        const {data} = await api.get('api/user/connections', {
            headers: {Authorization: `Bearer ${token}`}
        })
        return data.success ? data : null
    }
)

const connectionSlice = createSlice({
    name: 'connections',
    initialState,
    reducers: {
        setUserOnline: (state, action) => {
            if (!state.onlineUsers.includes(action.payload)) {
                state.onlineUsers.push(action.payload);
            }
        },
        setUserOffline: (state, action) => {
            state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
        },
        updateUserStatus: (state, action) => {
            const { userId, isOnline } = action.payload;
            console.log(`Redux: Updating ${userId} to ${isOnline ? 'online' : 'offline'}`);
            if (isOnline) {
                if (!state.onlineUsers.includes(userId)) {
                    state.onlineUsers.push(userId);
                    console.log(`Redux: Added ${userId} to onlineUsers. Total online:`, state.onlineUsers.length);
                }
            } else {
                state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
                console.log(`Redux: Removed ${userId} from onlineUsers. Total online:`, state.onlineUsers.length);
            }
            console.log('Redux: Current onlineUsers:', state.onlineUsers);
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchConnections.fulfilled, (state, action) => {
            if(action.payload){
                state.connections = action.payload.connections
                state.pendingConnections = action.payload.pendingConnections
                state.followers = action.payload.followers
                state.following = action.payload.following
            }
        })
    }
})

export const { setUserOnline, setUserOffline, updateUserStatus } = connectionSlice.actions;
export default connectionSlice.reducer