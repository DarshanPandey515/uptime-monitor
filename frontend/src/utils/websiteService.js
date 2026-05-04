import { api } from "./api";



export const createWebsite = async (data) => {
    const res = await api.post("website/", data);
    return res.data;
}

export const fetchWebsite = async () => {
    const res = await api.get("website/");
    return res.data;
}

export const fetchWebsiteId = async (id) => {
    const res = await api.get(`website/${id}/`);    
    return res.data;
}


export const toggleWebsite = async (id, isActive) => {
    const res = await api.post(`website/${id}/toggle/`, { is_active: isActive });
    return res.data;
};

export const toggleMonitor = async (action) => {
    const res = await api.post("websites/toggle_monitor/", { action });
    return res.data;
};

export const updateWebsite = async (id, data) => {
    const res = await api.put(`website/${id}/`, data);
    return res.data;
};

export const deleteWebsite = async (id) => {
    await api.delete(`website/${id}/`);
};
