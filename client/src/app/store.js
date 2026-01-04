import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../features/user/userSlice.js'
import connectionsReducer from '../features/connections/connectionSlice.js'
import messagesReducer from '../features/messages/messagesSlice.js'
import uiReducer from '../features/ui/uiSlice.js'


export const store = configureStore({
    reducer: {
        user: userReducer,
        connections: connectionsReducer,
        messages: messagesReducer,
        ui: uiReducer
    }
})