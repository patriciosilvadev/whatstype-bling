import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://bling.com.br/Api/v2/'
})

export const apikey = "d7fb799ac73083aff22972767514e828b1bb38d0f29b2ae4030eee22f07ce34e32b9c1f2"

export const config = {
  headers: {
    'Content-Type': 'application/xml'
  },
  params:{}
}