import axios from "axios"

export const getMessages = async (conversationId)=> { 
    try {
        const { data } = await axios.post(`${process.env.CHAT_SERVICE}/get-message/${conversationId}`)
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}