import { createSlice } from "@reduxjs/toolkit"

const UserSlice=createSlice({
    name: "user",
    initialState:{
        userData:null,
    },
    reducers:{
        setUserdata:(state, action)=>{
            state.userData = action.payload
        }
    }
})

export const {setUserdata}=UserSlice.actions
export default UserSlice.reducer