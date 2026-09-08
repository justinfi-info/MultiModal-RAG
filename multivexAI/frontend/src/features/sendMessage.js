import api from '../../utils/axios'

async function sendMessage(payload) {
    try {
        const {data}=await api.post("/api/agent/chat", payload)
        return data
    } catch (error) {
        console.log(error)
        return {
            error: error?.response?.data?.message || "Failed to send message. Please try again."
        }
    }

}

export default sendMessage
