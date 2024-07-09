import axios from 'axios'
import { store } from '@/Store/index.js'
import {tr} from "vuetify/locale";
const clientApi = axios.create({
    baseURL: import.meta.env.VITE_BACKEND,
})
const unAuthorizedLinks=[
    "/signIn","/signUp"
]
clientApi.interceptors.request.use(
    (config) => {
        if(!unAuthorizedLinks.includes(config.url)){
            const user= store.getUser()
                config.headers['Authorization'] = `Bearer ${store.getToken()}`
                config.headers['email'] = user?.email
        }

        if( config.url !== "/imgUpload"){
            config.headers['Content-Type'] = `application/json`
        }else{
            config.headers['Content-Type'] = `multipart/form-data`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)
clientApi.defaults.timeout = 4000
clientApi.interceptors.response.use(
    (response) => {
        const code = response.data.code
        if (code == 200) {
            return response.data
        } else {
            return Promise.reject(response.data || 'request error')
        }
    },
    async (error) => {
        const originalRequest = error.config;
        console.log("the incoming error",[originalRequest , error])
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            await store.runRefreshToken()
            originalRequest.headers['Authorization'] = `Bearer ${store.getToken()}`;
            // console.log("trying again with refresh token", store.getRefreshToken())
            return clientApi(originalRequest);
        }
        if (error.response.status === 401 && originalRequest._retry) {
            store.unAuthorized = true
        }
        return Promise.reject(error)
    }
)


export function signIn(value) {
    return post('/signIn', value)
}

export function signUp(value) {
    return post('/signUp', value)
}
export function imgUpload(value) {
    return post('/imgUpload', value)
}


export function getUserImages(value) {
    return get('/getUserImages', value)
}


export function post(url, data = {}) {
    return new Promise(function (resolve, reject) {
        clientApi
            .post(url, data)
            .then((res) => {
                resolve(res)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

export function get(url, data = {}) {
    return new Promise(function (resolve, reject) {
        clientApi
            .get(url, {
                params: data
            })
            .then((res) => {
                resolve(res)
            })
            .catch((error) => {
                reject(error)
            })
    })
}
