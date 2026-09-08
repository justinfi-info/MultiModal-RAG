import api from '../../utils/axios'

async function getMessages(id) {
    try {
        const { data } = await api.post(`/api/chat/get-message/${id}`)
        return data
    } catch (error) {
        console.log(error)
        return []
    }
}

export default getMessages
