import axios from 'axios';

let base = '';
let localhost = 'http://localhost:8080';
let url = localhost;
export const requestLogin = params => { return axios.post(`${url}/user/login`, params).then(res => res.data); };
// export const requestLogin = params => { return axios.post(`${base}/login`, params).then(res => res.data); };

export const getUserList = params => { return axios.get(`${url}/cow/query_page`, { params: params }); };

export const getCowListPage = params => {
    return axios.get(`${url}/cow/query_page`, { params: params })
        .then(res => res.data);
};

export const removeUser = params => { return axios.get(`${url}/cow/remove`, { params: params });};

export const batchRemoveUser = params => { return axios.get(`${url}/cow/batch_remove`, { params: params }).then(res=>res.data); };

export const editUser = params => { return axios.post(`${url}/cow/update`,  params ).then(res=>res.data); };

export const addUser = params => { return axios.post(`${url}/cow/insert`,  params).then(res=>res.data); };

export const queryCowHeat = params => {
    console.log(params);
    return axios.get(`${url}/cow_heat/query_true_cow_heat`, {params: params})
        .then(res=>res.data);
};

export const queryPredictHeat = params => {
    console.log("start queryPredictHeat,params is "+JSON.stringify(params));
    return axios.post(`${url}/cow_heat/predict`,params).then(res=>res.data);
};
