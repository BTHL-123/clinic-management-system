import axiosClient from "./axiosClient";

export const getUsers = (params) => axiosClient.get("/users", { params });
