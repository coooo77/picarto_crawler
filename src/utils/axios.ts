import axios from 'axios'

const instance = axios.create({
  baseURL: 'https://ptvintern.picarto.tv/api/',
  headers: {
    accept: 'application/json',
  },
})

export default instance
