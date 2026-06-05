import axiosClient from "./axiosClient";

export const getSystemSettings = (params) =>
  axiosClient.get("/system-settings", { params });

export const getSystemSettingByKey = (settingKey) =>
  axiosClient.get(`/system-settings/${encodeURIComponent(settingKey)}`);

export const upsertSystemSetting = (settingKey, payload) =>
  axiosClient.put(`/system-settings/${encodeURIComponent(settingKey)}`, payload);

export const deleteSystemSetting = (settingKey) =>
  axiosClient.delete(`/system-settings/${encodeURIComponent(settingKey)}`);
