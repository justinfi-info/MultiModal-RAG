import api from '../../utils/axios'

async function logoOut() {
    try {
        const {data} = await api.get("/api/auth/logout")
        console.log(data)
    } catch (error) {
        console.log(error)
    }
}

export default logoOut